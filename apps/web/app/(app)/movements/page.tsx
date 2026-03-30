"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../../../components/app-shell";
import { FieldLabel, Panel, SelectInput, TextInput } from "../../../components/ui";
import { apiFetch } from "../../../lib/api";

type Movement = {
  id: string;
  movementType: string;
  status: string;
  dueDate: string | null;
  amount: string;
  currency: string;
  category: string;
  counterparty: string | null;
  description: string | null;
};

export default function MovementsPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [filters, setFilters] = useState({
    category: "",
    status: "",
    movementType: "",
  });

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    apiFetch<Movement[]>(`/movements?${params.toString()}`).then(setMovements);
  }, [filters]);

  return (
    <AppShell title="Movimientos financieros">
      <Panel>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <FieldLabel>Categoría</FieldLabel>
            <TextInput
              onChange={(event) =>
                setFilters((current) => ({ ...current, category: event.target.value }))
              }
              placeholder="PAYROLL, SALES..."
              value={filters.category}
            />
          </div>
          <div>
            <FieldLabel>Estado</FieldLabel>
            <SelectInput
              onChange={(event) =>
                setFilters((current) => ({ ...current, status: event.target.value }))
              }
              value={filters.status}
            >
              <option value="">Todos</option>
              <option value="REALIZED">REALIZED</option>
              <option value="PENDING">PENDING</option>
              <option value="FORECAST">FORECAST</option>
            </SelectInput>
          </div>
          <div>
            <FieldLabel>Tipo</FieldLabel>
            <SelectInput
              onChange={(event) =>
                setFilters((current) => ({ ...current, movementType: event.target.value }))
              }
              value={filters.movementType}
            >
              <option value="">Todos</option>
              <option value="INFLOW">INFLOW</option>
              <option value="OUTFLOW">OUTFLOW</option>
            </SelectInput>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="text-sm uppercase tracking-[0.18em] text-stone-500">
              <tr>
                <th className="pb-3">Fecha</th>
                <th className="pb-3">Tipo</th>
                <th className="pb-3">Estado</th>
                <th className="pb-3">Categoría</th>
                <th className="pb-3">Contraparte</th>
                <th className="pb-3 text-right">Importe</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((movement) => (
                <tr className="border-t border-stone-200" key={movement.id}>
                  <td className="py-4">
                    {movement.dueDate ? new Date(movement.dueDate).toLocaleDateString("es-ES") : "-"}
                  </td>
                  <td>{movement.movementType}</td>
                  <td>{movement.status}</td>
                  <td>{movement.category}</td>
                  <td>{movement.counterparty ?? movement.description ?? "-"}</td>
                  <td className="text-right">
                    {Number(movement.amount).toFixed(2)} {movement.currency}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
