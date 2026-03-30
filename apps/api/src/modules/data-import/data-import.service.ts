import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CsvImportConnector } from "./csv-import.connector";
import { UploadImportDto } from "./dto/upload-import.dto";
import { NormalizationService } from "./normalization.service";
import { ImportReport } from "./types";

@Injectable()
export class DataImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly csvConnector: CsvImportConnector,
    private readonly normalizationService: NormalizationService,
  ) {}

  async upload(
    organizationId: string,
    file: Express.Multer.File | undefined,
    dto: UploadImportDto,
  ) {
    if (!file) {
      throw new BadRequestException("Debes adjuntar un archivo CSV");
    }

    let rows: Record<string, string>[];
    try {
      rows = this.csvConnector.parseBuffer(file.buffer);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "El CSV no se pudo procesar";
      throw new BadRequestException(
        `CSV mal formado o con columnas inconsistentes: ${message}`,
      );
    }

    let mapping:
      | {
          columns?: Record<string, string>;
          categories?: Record<string, string>;
        }
      | undefined;
    try {
      mapping = this.normalizationService.normalizeMapping(dto.columnMapping);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo leer el mapping";
      throw new BadRequestException(`Mapping inválido: ${message}`);
    }

    const normalized = this.normalizationService.normalizeRows(rows, mapping);

    const existingHashes = await this.prisma.financialMovement.findMany({
      where: {
        organizationId,
        duplicateHash: {
          in: normalized.valid.map((row) => row.duplicateHash),
        },
      },
      select: {
        duplicateHash: true,
      },
    });

    const duplicateHashes = new Set(existingHashes.map((item) => item.duplicateHash ?? ""));
    const acceptedRows = normalized.valid.filter(
      (row) => !duplicateHashes.has(row.duplicateHash),
    );
    const duplicateErrors = normalized.valid
      .filter((row) => duplicateHashes.has(row.duplicateHash))
      .map((row, index) => ({
        rowNumber: rows.length + index + 2,
        messages: ["duplicado detectado frente a registros existentes"],
        rawRow: {
          amount: String(row.amount),
          category: row.category,
          description: row.description ?? "",
        },
      }));

    const dataSource = await this.prisma.dataSource.create({
      data: {
        organizationId,
        sourceType: "CSV",
        sourceName: file.originalname,
        importType: dto.importType,
        importStatus:
          normalized.errors.length + duplicateErrors.length > 0
            ? acceptedRows.length > 0
              ? "PARTIAL"
              : "FAILED"
            : "COMPLETED",
        importedAt: new Date(),
        rawFilename: file.originalname,
        rowsTotal: rows.length,
        rowsValid: acceptedRows.length,
        rowsInvalid: normalized.errors.length + duplicateErrors.length,
        missingFieldsJson: normalized.missingFields,
        categorySummary: normalized.categorySummary,
      },
    });

    if (acceptedRows.length > 0) {
      await this.prisma.financialMovement.createMany({
        data: acceptedRows.map((row) => ({
          organizationId,
          sourceId: dataSource.id,
          movementType: row.movementType,
          status: row.status,
          occurredAt: row.occurredAt,
          dueDate: row.dueDate,
          amount: new Prisma.Decimal(row.amount),
          currency: row.currency,
          category: row.category,
          subcategory: row.subcategory,
          counterparty: row.counterparty,
          description: row.description,
          rawReference: row.rawReference,
          duplicateHash: row.duplicateHash,
        })),
      });
    }

    const allErrors = [...normalized.errors, ...duplicateErrors];
    if (allErrors.length > 0) {
      await this.prisma.importRowError.createMany({
        data: allErrors.map((error) => ({
          dataSourceId: dataSource.id,
          rowNumber: error.rowNumber,
          rawRow: error.rawRow,
          messages: error.messages,
        })),
      });
    }

    return this.getReport(organizationId, dataSource.id);
  }

  async getReport(organizationId: string, importId: string): Promise<ImportReport> {
    const dataSource = await this.prisma.dataSource.findFirst({
      where: {
        id: importId,
        organizationId,
      },
      include: {
        rowErrors: {
          orderBy: {
            rowNumber: "asc",
          },
        },
      },
    });

    if (!dataSource) {
      throw new NotFoundException("Importación no encontrada");
    }

    return {
      id: dataSource.id,
      importType: dataSource.importType,
      sourceName: dataSource.sourceName,
      importStatus: dataSource.importStatus,
      rowsTotal: dataSource.rowsTotal,
      rowsValid: dataSource.rowsValid,
      rowsInvalid: dataSource.rowsInvalid,
      categorySummary: (dataSource.categorySummary ?? {}) as Record<string, number>,
      missingFields: ((dataSource.missingFieldsJson ?? []) as string[]) ?? [],
      errors: dataSource.rowErrors.map((rowError) => ({
        rowNumber: rowError.rowNumber,
        messages: rowError.messages as string[],
        rawRow: rowError.rawRow as Record<string, string>,
      })),
    };
  }
}
