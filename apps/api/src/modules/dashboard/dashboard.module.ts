import { Module } from "@nestjs/common";
import { ExternalSignalsModule } from "../external-signals/external-signals.module";
import { ForecastingModule } from "../forecasting/forecasting.module";
import { OrganizationsModule } from "../organizations/organizations.module";
import { RiskModule } from "../risk/risk.module";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";

@Module({
  imports: [OrganizationsModule, ForecastingModule, RiskModule, ExternalSignalsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
