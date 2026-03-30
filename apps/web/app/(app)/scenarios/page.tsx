"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../../../components/app-shell";
import {
  FieldLabel,
  Panel,
  PrimaryButton,
  SelectInput,
  TextInput,
} from "../../../components/ui";
import { apiFetch } from "../../../lib/api";

type Scenario = {
  id: string;
  name: string;
  description: string | null;
  resultsJson?: {
    comparison: {
      baseBreak90: number;
      scenarioBreak90: number;
      baseTension90: number;
      scenarioTension90: number;
      minimumBalanceDelta: number;
    };
  };
};

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [form, setForm] = useState({
    name: "Posponer pago proveedor clave",
    description: "Mover el pago 15 días",
    type: "DELAY_PAYMENT",
    category: "SUPPLIER",
    days: 15,
    percentage: 10,
    amount: 20000,
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
  });

  const load = () => apiFetch<Scenario[]>("/scenarios").then(setScenarios);

  useEffect(() => {
    load();
  }, []);

  const createScenario = async () => {
    await apiFetch("/scenarios", {
      method: "POST",
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        actions: [
          {
            type: form.type,
            category: form.category,
            days: Number(form.days),
            percentage: Number(form.percentage),
            amount: Number(form.amount),
            dueDate: form.dueDate,
            description: form.description,
          },
        ],
      }),
    });
    await load();
  };

  const runScenario = async (id: string) => {
    await apiFetch(`/scenarios/${id}/run`, { method: "POST" });
    await load();
  };

  return (
    <AppShell title="Simulación de escenarios">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Panel>
          <h3 className="text-2xl font-semibold">Crear escenario</h3>
          <div className="mt-5 grid gap-4">
            <div>
              <FieldLabel>Nombre</FieldLabel>
              <TextInput onChange={(e) => setForm({ ...form, name: e.target.value })} value={form.name} />
            </div>
            <div>
              <FieldLabel>Descripción</FieldLabel>
              <TextInput onChange={(e) => setForm({ ...form, description: e.target.value })} value={form.description} />
            </div>
            <div>
              <FieldLabel>Tipo de acción</FieldLabel>
              <SelectInput onChange={(e) => setForm({ ...form, type: e.target.value })} value={form.type}>
                <option value="DELAY_PAYMENT">Retrasar pago</option>
                <option value="ACCELERATE_COLLECTION">Adelantar cobro</option>
                <option value="INCREASE_FORECAST_SALES">Aumentar ventas previstas</option>
                <option value="REDUCE_EXPENSE_CATEGORY">Reducir gasto por categoría</option>
                <option value="ADD_EXTRA_EXPENSE">Añadir gasto extraordinario</option>
                <option value="POSTPONE_INVESTMENT">Posponer inversión</option>
              </SelectInput>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>Categoría</FieldLabel>
                <TextInput onChange={(e) => setForm({ ...form, category: e.target.value })} value={form.category} />
              </div>
              <div>
                <FieldLabel>Días</FieldLabel>
                <TextInput onChange={(e) => setForm({ ...form, days: Number(e.target.value) })} type="number" value={String(form.days)} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>Porcentaje</FieldLabel>
                <TextInput onChange={(e) => setForm({ ...form, percentage: Number(e.target.value) })} type="number" value={String(form.percentage)} />
              </div>
              <div>
                <FieldLabel>Importe</FieldLabel>
                <TextInput onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} type="number" value={String(form.amount)} />
              </div>
            </div>
            <div>
              <FieldLabel>Fecha objetivo</FieldLabel>
              <TextInput onChange={(e) => setForm({ ...form, dueDate: e.target.value })} type="date" value={form.dueDate} />
            </div>
          </div>
          <PrimaryButton className="mt-6" onClick={createScenario} type="button">
            Guardar escenario
          </PrimaryButton>
        </Panel>

        <Panel>
          <h3 className="text-2xl font-semibold">Base vs escenario</h3>
          <div className="mt-5 space-y-4">
            {scenarios.map((scenario) => (
              <div className="rounded-3xl bg-[var(--surface-strong)] p-5" key={scenario.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-xl font-semibold">{scenario.name}</h4>
                    <p className="text-stone-600">{scenario.description}</p>
                  </div>
                  <PrimaryButton onClick={() => runScenario(scenario.id)} type="button">
                    Ejecutar
                  </PrimaryButton>
                </div>
                {scenario.resultsJson?.comparison ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div>Rotura 90d: {scenario.resultsJson.comparison.baseBreak90}% → {scenario.resultsJson.comparison.scenarioBreak90}%</div>
                    <div>Tensión 90d: {scenario.resultsJson.comparison.baseTension90}% → {scenario.resultsJson.comparison.scenarioTension90}%</div>
                    <div>Delta peor saldo: {scenario.resultsJson.comparison.minimumBalanceDelta.toFixed(2)} €</div>
                  </div>
                ) : (
                  <p className="mt-4 text-stone-500">Ejecuta el escenario para comparar contra la base.</p>
                )}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
