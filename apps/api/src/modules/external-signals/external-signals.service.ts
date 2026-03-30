import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ExternalSignalsService {
  constructor(private readonly prisma: PrismaService) {}

  list(organizationId?: string, sector?: string | null) {
    return this.prisma.externalSignal.findMany({
      where: {
        OR: [
          { organizationId: null },
          organizationId ? { organizationId } : undefined,
        ].filter(Boolean) as never,
        sector: sector ?? undefined,
      },
      orderBy: [{ signalDate: "desc" }, { createdAt: "desc" }],
      take: 10,
    });
  }
}
