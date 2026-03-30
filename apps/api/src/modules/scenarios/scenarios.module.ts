import { Module } from "@nestjs/common";
import { ForecastingModule } from "../forecasting/forecasting.module";
import { ScenariosController } from "./scenarios.controller";
import { ScenariosService } from "./scenarios.service";

@Module({
  imports: [ForecastingModule],
  controllers: [ScenariosController],
  providers: [ScenariosService],
})
export class ScenariosModule {}
