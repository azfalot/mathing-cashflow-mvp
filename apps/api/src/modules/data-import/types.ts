import { MovementStatus, MovementType } from "@prisma/client";

export type NormalizedImportRow = {
  movementType: MovementType;
  status: MovementStatus;
  occurredAt: Date | null;
  dueDate: Date | null;
  amount: number;
  currency: string;
  category: string;
  subcategory?: string | null;
  counterparty?: string | null;
  description?: string | null;
  rawReference?: string | null;
  duplicateHash: string;
};

export type ImportReport = {
  id: string;
  importType: string;
  sourceName: string;
  importStatus: string;
  rowsTotal: number;
  rowsValid: number;
  rowsInvalid: number;
  categorySummary: Record<string, number>;
  missingFields: string[];
  errors: Array<{
    rowNumber: number;
    messages: string[];
    rawRow: Record<string, string>;
  }>;
};
