import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { JwtPayload } from "../auth/jwt.strategy";
import { CreateMovementDto } from "./dto/create-movement.dto";
import { FinancialMovementsService } from "./financial-movements.service";

@Controller("movements")
@UseGuards(JwtAuthGuard)
export class FinancialMovementsController {
  constructor(private readonly movementsService: FinancialMovementsService) {}

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query() query: Record<string, string | undefined>,
  ) {
    return this.movementsService.list(user.organizationId, query);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateMovementDto) {
    return this.movementsService.create(user.organizationId, dto);
  }
}
