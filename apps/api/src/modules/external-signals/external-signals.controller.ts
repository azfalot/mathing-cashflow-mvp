import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { JwtPayload } from "../auth/jwt.strategy";
import { OrganizationsService } from "../organizations/organizations.service";
import { ExternalSignalsService } from "./external-signals.service";

@Controller("external-signals")
@UseGuards(JwtAuthGuard)
export class ExternalSignalsController {
  constructor(
    private readonly externalSignalsService: ExternalSignalsService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  @Get()
  async list(@CurrentUser() user: JwtPayload) {
    const organization = await this.organizationsService.getCurrentOrganization(
      user.organizationId,
    );
    return this.externalSignalsService.list(user.organizationId, organization.profile?.sector);
  }
}
