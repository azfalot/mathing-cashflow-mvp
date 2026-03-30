import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { JwtPayload } from "../auth/jwt.strategy";
import { ForecastingService } from "./forecasting.service";

@Controller("forecast")
@UseGuards(JwtAuthGuard)
export class ForecastingController {
  constructor(private readonly forecastingService: ForecastingService) {}

  @Get()
  getForecast(@CurrentUser() user: JwtPayload) {
    return this.forecastingService.getForecast(user.organizationId);
  }
}
