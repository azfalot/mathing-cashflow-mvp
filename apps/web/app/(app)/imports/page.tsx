"use client";

import { useMemo, useState } from "react";
import { CATEGORY_CATALOG } from "@repo/shared/category-catalog";
import { AppShell } from "../../../components/app-shell";
import {
  FieldLabel,
  Panel,
  PrimaryButton,
  SelectInput,
} from "../../../components/ui";
import { uploadFile } from "../../../lib/api";

type ImportReport = {
  rowsValid: number;
  rowsInvalid: number;
  importStatus: string;
  categorySummary: Record<string, number>;
  missingFields: string[];
  errors: Array<{ rowNumber: number; messages: string[] }>;
};

type PreviewState = {
  headers: string[];
  rows: Array<Record<string, string>>;
};

const FIELD_OPTIONS = [
  { key: "amount", label: "Importe" },
  { key: "occurredAt", label: "Fecha ocurrencia" },
  { key: "dueDate", label: "Fecha vencimiento" },
  { key: "movementType", label: "Tipo movimiento" },
  { key: "status", label: "Estado" },
  { key: "currency", label: "Moneda" },
  { key: "category", label: "Categoría" },
  { key: "subcategory", label: "Subcategoría" },
  { key: "counterparty", label: "Contraparte" },
  { key: "description", label: "Descripción" },
  { key: "rawReference", label: "Referencia" },
] as const;

const HEADER_HINTS: Record<string, string[]> = {
  amount: ["amount", "importe", "monto", "valor"],
  occurredAt: ["fecha", "date", "occurredat"],
  dueDate: ["duedate", "vencimiento", "expected_date"],
  movementType: ["tipo", "movementtype", "flow_type"],
  status: ["estado", "status"],
  currency: ["moneda", "currency"],
  category: ["categoria", "category"],
  subcategory: ["subcategoria", "subcategory"],
  counterparty: ["cliente", "proveedor", "counterparty", "partner"],
  description: ["descripcion", "description", "concepto"],
  rawReference: ["referencia", "reference", "invoice"],
};

export default function ImportsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importType, setImportType] = useState("transactions");
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [categoryMapping, setCategoryMapping] = useState<Record<string, string>>({});
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const detectedCategories = useMemo(() => {
    if (!preview || !fieldMapping.category) {
      return [];
    }

    const values = new Set<string>();
    preview.rows.forEach((row) => {
      const categoryColumn = fieldMapping.category;
      if (!categoryColumn) {
        return;
      }
      const value = row[categoryColumn];
      if (value) {
        values.add(value);
      }
    });
    return [...values];
  }, [preview, fieldMapping]);

  const handleFileSelected = async (selectedFile: File | null) => {
    setFile(selectedFile);
    setReport(null);
    setError(null);
    setCategoryMapping({});

    if (!selectedFile) {
      setPreview(null);
      setFieldMapping({});
      return;
    }

    try {
      const text = await selectedFile.text();
      const parsed = parseCsv(text);
      setPreview(parsed);
      setFieldMapping(autoDetectFieldMapping(parsed.headers));
    } catch (previewError) {
      setPreview(null);
      setFieldMapping({});
      setError(
        previewError instanceof Error
          ? previewError.message
          : "No se pudo leer el CSV",
      );
    }
  };

  const onUpload = async () => {
    if (!file) return;
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("importType", importType);
    formData.append(
      "columnMapping",
      JSON.stringify({
        columns: fieldMapping,
        categories: categoryMapping,
      }),
    );

    try {
      const result = await uploadFile<ImportReport>("/imports/upload", formData);
      setReport(result);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Error subiendo CSV");
    }
  };

  return (
    <AppShell title="Importación de datos">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_1.15fr]">
        <div className="space-y-6">
          <Panel>
            <FieldLabel>Tipo de importación</FieldLabel>
            <SelectInput onChange={(event) => setImportType(event.target.value)} value={importType}>
              <option value="transactions">Transacciones</option>
              <option value="obligations">Obligaciones futuras</option>
              <option value="forecasts">Previsiones</option>
            </SelectInput>

            <FieldLabel className="mt-6">Archivo CSV</FieldLabel>
            <input
              accept=".csv"
              className="block w-full rounded-2xl border border-dashed border-stone-300 bg-[var(--surface-strong)] p-8"
              onChange={(event) => handleFileSelected(event.target.files?.[0] ?? null)}
              type="file"
            />

            <PrimaryButton
              className="mt-6"
              disabled={!file}
              onClick={onUpload}
              type="button"
            >
              Validar e importar
            </PrimaryButton>

            {error ? <p className="mt-4 text-orange-700">{error}</p> : null}
          </Panel>

          <Panel>
            <h3 className="text-2xl font-semibold">Mapeo de columnas</h3>
            {!preview ? (
              <p className="mt-4 text-stone-600">
                Sube un CSV y la herramienta detectará las columnas para que puedas asignarlas desde la interfaz.
              </p>
            ) : (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {FIELD_OPTIONS.map((field) => (
                  <div key={field.key}>
                    <FieldLabel>{field.label}</FieldLabel>
                    <SelectInput
                      onChange={(event) =>
                        setFieldMapping((current) => ({
                          ...current,
                          [field.key]: event.target.value,
                        }))
                      }
                      value={fieldMapping[field.key] ?? ""}
                    >
                      <option value="">No mapear</option>
                      {preview.headers.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </SelectInput>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel>
            <h3 className="text-2xl font-semibold">Mapeo de categorías</h3>
            {!detectedCategories.length ? (
              <p className="mt-4 text-stone-600">
                Asigna primero la columna de categoría para mapear sus valores al catálogo interno.
              </p>
            ) : (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {detectedCategories.map((category) => (
                  <div key={category}>
                    <FieldLabel>{category}</FieldLabel>
                    <SelectInput
                      onChange={(event) =>
                        setCategoryMapping((current) => ({
                          ...current,
                          [category]: event.target.value,
                          [category.toLowerCase()]: event.target.value,
                        }))
                      }
                      value={categoryMapping[category] ?? ""}
                    >
                      <option value="">Auto / sin mapping</option>
                      {CATEGORY_CATALOG.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </SelectInput>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel>
            <h3 className="text-2xl font-semibold">Previsualización</h3>
            {!preview ? (
              <p className="mt-4 text-stone-600">
                Verás aquí las primeras filas del CSV para validar el mapping antes de importar.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500">
                      {preview.headers.map((header) => (
                        <th className="px-3 py-2 font-medium" key={header}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.slice(0, 6).map((row, index) => (
                      <tr className="border-b border-stone-100" key={index}>
                        {preview.headers.map((header) => (
                          <td className="px-3 py-2" key={`${index}-${header}`}>
                            {row[header]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel>
            <h3 className="text-2xl font-semibold">Reporte de importación</h3>
            {!report ? (
              <p className="mt-4 text-stone-600">
                Cuando importes, aquí verás filas válidas, errores y resumen de categorías mapeadas.
              </p>
            ) : (
              <div className="mt-6 space-y-5">
                <p>
                  Estado: <strong>{report.importStatus}</strong>
                </p>
                <p>Filas válidas: {report.rowsValid}</p>
                <p>Filas inválidas: {report.rowsInvalid}</p>
                <div>
                  <h4 className="font-semibold">Categorías mapeadas</h4>
                  {Object.entries(report.categorySummary).map(([key, value]) => (
                    <p key={key}>
                      {key}: {value}
                    </p>
                  ))}
                </div>
                <div>
                  <h4 className="font-semibold">Campos faltantes frecuentes</h4>
                  <p>{report.missingFields.join(", ") || "Sin incidencias"}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Errores</h4>
                  <div className="mt-2 space-y-2">
                    {report.errors.slice(0, 10).map((item) => (
                      <div
                        className="rounded-2xl bg-[var(--surface-strong)] p-3"
                        key={item.rowNumber}
                      >
                        Fila {item.rowNumber}: {item.messages.join(", ")}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

function autoDetectFieldMapping(headers: string[]) {
  const mapping: Record<string, string> = {};
  FIELD_OPTIONS.forEach((field) => {
    const hints = HEADER_HINTS[field.key];
    if (!hints) {
      return;
    }
    const found = headers.find((header) =>
      hints.includes(header.trim().toLowerCase()),
    );
    if (found) {
      mapping[field.key] = found;
    }
  });
  return mapping;
}

function parseCsv(text: string): PreviewState {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]!;
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(current);
      current = "";
      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  if (rows.length < 2) {
    throw new Error("El CSV necesita cabecera y al menos una fila de datos.");
  }

  const firstRow = rows[0];
  if (!firstRow) {
    throw new Error("El CSV no contiene cabecera.");
  }

  const headers = firstRow.map((item) => item.trim());
  const previewRows = rows.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? ""])),
  );

  return {
    headers,
    rows: previewRows,
  };
}
