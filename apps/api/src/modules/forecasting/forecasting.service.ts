import { Injectable } from "@nestjs/common";
import { FinancialMovement, OrganizationSettings } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { buildDeterministicForecast } from "./forecasting.domain";

@Injectable()
export class ForecastingService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrganizationInputs(organizationId: string): Promise<{
    movements: FinancialMovement[];
    settings: OrganizationSettings;
  }> {
    const [movements, settings] = await Promise.all([
      this.prisma.financialMovement.findMany({
        where: { organizationId },
      }),
      this.prisma.organizationSettings.findUniqueOrThrow({
        where: { organizationId },
      }),
    ]);

    return { movements, settings };
  }

  async getForecast(organizationId: string) {
    const { movements, settings } = await this.getOrganizationInputs(organizationId);
    const result = buildDeterministicForecast(movements, settings);

    await this.prisma.cashPositionSnapshot.create({
      data: {
        organizationId,
        snapshotDate: new Date(),
        currentCashBalance: result.currentCashBalance,
        projectedCashBalance30d: result.projectedBalances[30],
        projectedCashBalance60d: result.projectedBalances[60],
        projectedCashBalance90d: result.projectedBalances[90],
        minProjectedBalance90d: result.minimumBalance,
      },
    });

    return result;
  }
}
