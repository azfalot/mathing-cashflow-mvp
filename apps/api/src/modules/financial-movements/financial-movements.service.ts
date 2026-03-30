import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateMovementDto } from "./dto/create-movement.dto";

@Injectable()
export class FinancialMovementsService {
  constructor(private readonly prisma: PrismaService) {}

  list(organizationId: string, filters: Record<string, string | undefined>) {
    return this.prisma.financialMovement.findMany({
      where: {
        organizationId,
        category: filters.category,
        status: filters.status as never,
        movementType: filters.movementType as never,
        dueDate:
          filters.from || filters.to
            ? {
                gte: filters.from ? new Date(filters.from) : undefined,
                lte: filters.to ? new Date(filters.to) : undefined,
              }
            : undefined,
      },
      orderBy: [{ dueDate: "asc" }, { occurredAt: "desc" }],
    });
  }

  create(organizationId: string, dto: CreateMovementDto) {
    return this.prisma.financialMovement.create({
      data: {
        organizationId,
        movementType: dto.movementType,
        status: dto.status,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        amount: new Prisma.Decimal(dto.amount),
        currency: dto.currency,
        category: dto.category,
        subcategory: dto.subcategory,
        counterparty: dto.counterparty,
        description: dto.description,
        rawReference: dto.rawReference,
      },
    });
  }
}
