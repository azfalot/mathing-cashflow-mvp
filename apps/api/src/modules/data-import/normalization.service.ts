import { Injectable } from "@nestjs/common";
import { MovementStatus, MovementType } from "@prisma/client";
import { createHash } from "crypto";
import { DEFAULT_CATEGORY_MAP } from "./category-catalog";
import { NormalizedImportRow } from "./types";

@Injectable()
export class NormalizationService {
  private readonly requiredFields = [
    "amount",
    "occurredAt",
    "dueDate",
    "movementType",
    "status",
    "currency",
    "category",
    "subcategory",
    "counterparty",
    "description",
    "rawReference",
  ] as const;

  private readonly aliases: Record<string, string[]> = {
    amount: ["amount", "importe", "valor", "monto"],
    occurredAt: ["occurredAt", "fecha", "date", "posting_date"],
    dueDate: ["dueDate", "due_date", "vencimiento", "expected_date"],
    movementType: ["movementType", "tipo", "flow_type"],
    status: ["status", "estado"],
    currency: ["currency", "moneda"],
    category: ["category", "categoria"],
    subcategory: ["subcategory", "subcategoria"],
    counterparty: ["counterparty", "cliente", "proveedor", "partner"],
    description: ["description", "descripcion", "concepto"],
    rawReference: ["rawReference", "reference", "referencia", "invoice"],
  };

  normalizeRows(
    rows: Record<string, string>[],
    mapping?: {
      columns?: Record<string, string>;
      categories?: Record<string, string>;
    },
  ) {
    const valid: NormalizedImportRow[] = [];
    const errors: Array<{
      rowNumber: number;
      messages: string[];
      rawRow: Record<string, string>;
    }> = [];
    const categorySummary: Record<string, number> = {};
    const missingFields = new Set<string>();
    const seenHashes = new Set<string>();

    rows.forEach((row, index) => {
      const rowNumber = index + 2;
      const messages: string[] = [];
      const get = (field: string) => {
        const direct = mapping?.columns?.[field];
        if (direct && row[direct] !== undefined) {
          return row[direct];
        }

        const alias = this.aliases[field]?.find((candidate) => row[candidate] !== undefined);
        if (alias) {
          return row[alias];
        }

        return undefined;
      };

      const rawAmount = get("amount");
      const rawDate = get("occurredAt");
      const rawDueDate = get("dueDate");
      const rawType = get("movementType");
      const rawStatus = get("status");
      const rawCurrency = get("currency");
      const rawCategory = get("category");
      const counterparty = get("counterparty") ?? null;
      const description = get("description") ?? null;
      const rawReference = get("rawReference") ?? null;

      if (!rawAmount || Number.isNaN(Number(rawAmount))) {
        messages.push("amount obligatorio y numérico");
        missingFields.add("amount");
      }

      const dateValue = rawDate ? new Date(rawDate) : null;
      const dueDateValue = rawDueDate ? new Date(rawDueDate) : dateValue;
      if ((rawDate && Number.isNaN(dateValue?.getTime() ?? NaN)) || (!rawDate && !rawDueDate)) {
        messages.push("fecha válida obligatoria");
        missingFields.add("date");
      }

      const movementType = this.normalizeMovementType(rawType);
      if (!movementType) {
        messages.push("movement_type obligatorio");
        missingFields.add("movementType");
      }

      const status = this.normalizeStatus(rawStatus);
      if (!status) {
        messages.push("status obligatorio");
        missingFields.add("status");
      }

      if (!rawCurrency) {
        messages.push("currency obligatoria");
        missingFields.add("currency");
      }

      const category = this.normalizeCategory(rawCategory, mapping?.categories);
      if (!category) {
        messages.push("categoría obligatoria");
        missingFields.add("category");
      }

      if (messages.length > 0) {
        errors.push({ rowNumber, messages, rawRow: row });
        return;
      }

      const duplicateHash = createHash("sha1")
        .update(
          JSON.stringify({
            amount: Number(rawAmount),
            date: dueDateValue?.toISOString() ?? dateValue?.toISOString(),
            counterparty,
            description,
          }),
        )
        .digest("hex");

      if (seenHashes.has(duplicateHash)) {
        errors.push({
          rowNumber,
          messages: ["duplicado detectado en el propio CSV"],
          rawRow: row,
        });
        return;
      }

      seenHashes.add(duplicateHash);
      categorySummary[category!] = (categorySummary[category!] ?? 0) + 1;

      valid.push({
        movementType: movementType!,
        status: status!,
        occurredAt: dateValue,
        dueDate: dueDateValue,
        amount: Number(rawAmount),
        currency: rawCurrency!,
        category: category!,
        subcategory: get("subcategory") ?? null,
        counterparty,
        description,
        rawReference,
        duplicateHash,
      });
    });

    return {
      valid,
      errors,
      categorySummary,
      missingFields: [...missingFields],
    };
  }

  private normalizeMovementType(value?: string | null): MovementType | null {
    if (!value) return null;
    const normalized = value.toLowerCase();
    if (["inflow", "ingreso", "cobro"].includes(normalized)) return MovementType.INFLOW;
    if (["outflow", "gasto", "pago"].includes(normalized)) return MovementType.OUTFLOW;
    return null;
  }

  private normalizeStatus(value?: string | null): MovementStatus | null {
    if (!value) return null;
    const normalized = value.toLowerCase();
    if (["realized", "real", "realizado", "paid", "collected"].includes(normalized)) {
      return MovementStatus.REALIZED;
    }
    if (["pending", "pendiente", "open"].includes(normalized)) return MovementStatus.PENDING;
    if (["forecast", "prevision", "previsión", "budget"].includes(normalized)) {
      return MovementStatus.FORECAST;
    }
    return null;
  }

  private normalizeCategory(
    value?: string | null,
    categoryMapping?: Record<string, string>,
  ) {
    if (!value) return null;
    const normalized = value.toLowerCase();
    return (
      categoryMapping?.[value] ??
      categoryMapping?.[normalized] ??
      DEFAULT_CATEGORY_MAP[normalized] ??
      value.toUpperCase().replace(/\s+/g, "_")
    );
  }

  normalizeMapping(raw?: string | null) {
    if (!raw) {
      return undefined;
    }

    const parsed = JSON.parse(raw) as unknown;

    if (
      parsed &&
      typeof parsed === "object" &&
      ("columns" in parsed || "categories" in parsed)
    ) {
      const mapping = parsed as {
        columns?: Record<string, string>;
        categories?: Record<string, string>;
      };
      return {
        columns: mapping.columns ?? {},
        categories: mapping.categories ?? {},
      };
    }

    const legacy = parsed as Record<string, string>;
    const columns = Object.fromEntries(
      Object.entries(legacy).filter(([key]) =>
        this.requiredFields.includes(key as (typeof this.requiredFields)[number]),
      ),
    );

    return {
      columns,
      categories: {},
    };
  }
}
