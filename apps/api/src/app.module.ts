import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./modules/auth/auth.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { DataImportModule } from "./modules/data-import/data-import.module";
import { ExternalSignalsModule } from "./modules/external-signals/external-signals.module";
import { FinancialMovementsModule } from "./modules/financial-movements/financial-movements.module";
import { ForecastingModule } from "./modules/forecasting/forecasting.module";
import { OrganizationsModule } from "./modules/organizations/organizations.module";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { RiskModule } from "./modules/risk/risk.module";
import { ScenariosModule } from "./modules/scenarios/scenarios.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    OrganizationsModule,
    DataImportModule,
    FinancialMovementsModule,
    ForecastingModule,
    RiskModule,
    ScenariosModule,
    DashboardModule,
    ExternalSignalsModule,
  ],
})
export class AppModule {}
