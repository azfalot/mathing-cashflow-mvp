import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ForecastingService } from "../forecasting/forecasting.service";
import { calculateRiskAssessment } from "./risk.domain";

@Injectable()
export class RiskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly forecastingService: ForecastingService,
  ) {}

  async getAssessment(organizationId: string) {
    const { movements, settings } = await this.forecastingService.getOrganizationInputs(
      organizationId,
    );
    const result = calculateRiskAssessment(movements, settings);

    await Promise.all(
      result.summary.map((summary) =>
        this.prisma.riskAssessment.create({
          data: {
            organizationId,
            assessmentDate: new Date(),
            riskHorizonDays: summary.horizonDays,
            cashTensionProbability: summary.tensionProbability,
            cashBreakProbability: summary.breakProbability,
            riskLevel: summary.riskLevel,
            primaryDriversJson: result.drivers,
            recommendationsJson: result.recommendations,
            resultsJson: {
              ranges: result.balanceRanges[summary.horizonDays],
            },
          },
        }),
      ),
    );

    return result;
  }
}
