import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { JwtPayload } from "../auth/jwt.strategy";
import { RiskService } from "./risk.service";

@Controller("risk-assessment")
@UseGuards(JwtAuthGuard)
export class RiskController {
  constructor(private readonly riskService: RiskService) {}

  @Get()
  getAssessment(@CurrentUser() user: JwtPayload) {
    return this.riskService.getAssessment(user.organizationId);
  }
}
