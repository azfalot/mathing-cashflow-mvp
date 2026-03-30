import { Module } from "@nestjs/common";
import { ForecastingModule } from "../forecasting/forecasting.module";
import { RiskController } from "./risk.controller";
import { RiskService } from "./risk.service";

@Module({
  imports: [ForecastingModule],
  controllers: [RiskController],
  providers: [RiskService],
  exports: [RiskService],
})
export class RiskModule {}
