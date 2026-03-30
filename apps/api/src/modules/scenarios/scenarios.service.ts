import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { ScenarioAction } from "@repo/shared/scenario";
import { PrismaService } from "../prisma/prisma.service";
import { ForecastingService } from "../forecasting/forecasting.service";
import { CreateScenarioDto } from "./dto/create-scenario.dto";
import { applyScenarioActions, createSyntheticMovements } from "./scenario.domain";
import { buildDeterministicForecast } from "../forecasting/forecasting.domain";
import { calculateRiskAssessment } from "../risk/risk.domain";

@Injectable()
export class ScenariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly forecastingService: ForecastingService,
  ) {}

  create(organizationId: string, dto: CreateScenarioDto) {
    return this.prisma.scenarioSimulation.create({
      data: {
        organizationId,
        name: dto.name,
        description: dto.description,
        scenarioParametersJson: ({
          actions: dto.actions,
        } as unknown) as Prisma.InputJsonValue,
      },
    });
  }

  list(organizationId: string) {
    return this.prisma.scenarioSimulation.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(organizationId: string, scenarioId: string) {
    const scenario = await this.prisma.scenarioSimulation.findFirst({
      where: { id: scenarioId, organizationId },
    });
    if (!scenario) throw new NotFoundException("Escenario no encontrado");
    return scenario;
  }

  async run(organizationId: string, scenarioId: string) {
    const scenario = await this.getById(organizationId, scenarioId);
    const { movements, settings } = await this.forecastingService.getOrganizationInputs(
      organizationId,
    );
    const baseForecast = buildDeterministicForecast(movements, settings);
    const baseRisk = calculateRiskAssessment(movements, settings);
    const actions =
      (((scenario.scenarioParametersJson as unknown as { actions?: ScenarioAction[] })?.actions ??
        []) as ScenarioAction[]) ?? [];
    const simulatedMovements = [
      ...applyScenarioActions(movements, actions),
      ...createSyntheticMovements(actions),
    ];
    const scenarioForecast = buildDeterministicForecast(simulatedMovements, settings);
    const scenarioRisk = calculateRiskAssessment(simulatedMovements, settings);

    const results = {
      forecast: scenarioForecast,
      risk: scenarioRisk,
      comparison: {
        baseBreak90: baseRisk.summary.find((item) => item.horizonDays === 90)?.breakProbability ?? 0,
        scenarioBreak90:
          scenarioRisk.summary.find((item) => item.horizonDays === 90)?.breakProbability ?? 0,
        baseTension90:
          baseRisk.summary.find((item) => item.horizonDays === 90)?.tensionProbability ?? 0,
        scenarioTension90:
          scenarioRisk.summary.find((item) => item.horizonDays === 90)?.tensionProbability ?? 0,
        minimumBalanceDelta: scenarioForecast.minimumBalance - baseForecast.minimumBalance,
      },
    };

    return this.prisma.scenarioSimulation.update({
      where: { id: scenario.id },
      data: {
        resultsJson: results,
      },
    });
  }
}
