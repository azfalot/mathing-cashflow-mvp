import { Injectable } from "@nestjs/common";
import type { DashboardSummary } from "@repo/shared";
import { PrismaService } from "../prisma/prisma.service";
import { OrganizationsService } from "../organizations/organizations.service";
import { ForecastingService } from "../forecasting/forecasting.service";
import { RiskService } from "../risk/risk.service";
import { toNumber } from "../common/decimal";
import { ExternalSignalsService } from "../external-signals/external-signals.service";

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizationsService: OrganizationsService,
    private readonly forecastingService: ForecastingService,
    private readonly riskService: RiskService,
    private readonly externalSignalsService: ExternalSignalsService,
  ) {}

  async getSummary(organizationId: string): Promise<DashboardSummary> {
    const [organization, forecast, risk, movements] = await Promise.all([
      this.organizationsService.getCurrentOrganization(organizationId),
      this.forecastingService.getForecast(organizationId),
      this.riskService.getAssessment(organizationId),
      this.prisma.financialMovement.findMany({ where: { organizationId } }),
    ]);
    const marketSignals = await this.externalSignalsService.list(
      organizationId,
      organization.profile?.sector,
    );

    const criticalPayments = movements
      .filter((movement) => movement.movementType === "OUTFLOW" && movement.status !== "REALIZED")
      .sort(
        (a, b) =>
          (a.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER) -
          (b.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER),
      )
      .slice(0, 5)
      .map((movement) => ({
        id: movement.id,
        dueDate: (movement.dueDate ?? movement.occurredAt ?? new Date()).toISOString(),
        amount: toNumber(movement.amount),
        counterparty: movement.counterparty,
        category: movement.category,
      }));

    const relevantInflows = movements
      .filter((movement) => movement.movementType === "INFLOW" && movement.status !== "REALIZED")
      .sort((a, b) => toNumber(b.amount) - toNumber(a.amount))
      .slice(0, 5)
      .map((movement) => ({
        id: movement.id,
        dueDate: (movement.dueDate ?? movement.occurredAt ?? new Date()).toISOString(),
        amount: toNumber(movement.amount),
        counterparty: movement.counterparty,
        category: movement.category,
      }));

    return {
      currentCashBalance: forecast.currentCashBalance,
      projectedBalances: forecast.projectedBalances,
      riskByHorizon: risk.summary,
      timeline: forecast.timeline,
      criticalPayments,
      relevantInflows,
      marketSignals: marketSignals.map((signal) => ({
        id: signal.id,
        title: signal.title,
        signalDate: signal.signalDate.toISOString(),
        sourceName: signal.sourceName,
        description: signal.description,
        sector: signal.sector,
        impactScore: signal.impactScore,
      })),
      drivers: risk.drivers,
      recommendations: risk.recommendations,
    };
  }
}
