import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { JwtPayload } from "../auth/jwt.strategy";
import { CreateScenarioDto } from "./dto/create-scenario.dto";
import { ScenariosService } from "./scenarios.service";

@Controller("scenarios")
@UseGuards(JwtAuthGuard)
export class ScenariosController {
  constructor(private readonly scenariosService: ScenariosService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateScenarioDto) {
    return this.scenariosService.create(user.organizationId, dto);
  }

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.scenariosService.list(user.organizationId);
  }

  @Get(":id")
  getById(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.scenariosService.getById(user.organizationId, id);
  }

  @Post(":id/run")
  run(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.scenariosService.run(user.organizationId, id);
  }
}
