import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { JwtPayload } from "../auth/jwt.strategy";
import { UpdateOrganizationSettingsDto } from "./dto/update-organization-settings.dto";
import { OrganizationsService } from "./organizations.service";

@Controller("organizations")
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get("current")
  getCurrent(@CurrentUser() user: JwtPayload) {
    return this.organizationsService.getCurrentOrganization(user.organizationId);
  }

  @Patch("current")
  updateCurrent(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateOrganizationSettingsDto,
  ) {
    return this.organizationsService.updateSettings(user.organizationId, dto);
  }
}
