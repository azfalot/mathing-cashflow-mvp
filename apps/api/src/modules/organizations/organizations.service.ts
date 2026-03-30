import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateOrganizationSettingsDto } from "./dto/update-organization-settings.dto";

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentOrganization(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        profile: true,
        settings: true,
      },
    });

    if (!organization) {
      throw new NotFoundException("Organización no encontrada");
    }

    return organization;
  }

  async updateSettings(organizationId: string, dto: UpdateOrganizationSettingsDto) {
    return this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        profile: {
          update: {
            currency: dto.currency,
            sector: dto.sector,
          },
        },
        settings: {
          update: {
            tensionThresholdAmount:
              dto.tensionThresholdAmount !== undefined
                ? new Prisma.Decimal(dto.tensionThresholdAmount)
                : undefined,
            tensionThresholdDays: dto.tensionThresholdDays,
            monteCarloRuns: dto.monteCarloRuns,
            defaultCurrency: dto.currency,
          },
        },
      },
      include: {
        profile: true,
        settings: true,
      },
    });
  }
}
