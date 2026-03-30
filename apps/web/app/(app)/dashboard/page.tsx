"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "../../../components/app-shell";
import { Panel, StatCard } from "../../../components/ui";
import { apiFetch } from "../../../lib/api";

type DashboardSummary = {
  currentCashBalance: number;
  projectedBalances: Record<30 | 60 | 90, number>;
  riskByHorizon: Array<{
    horizonDays: 30 | 60 | 90;
    tensionProbability: number;
    breakProbability: number;
    riskLevel: string;
  }>;
  timeline: Array<{
    date: string;
    balance: number;
    inflows: number;
    outflows: number;
  }>;
  criticalPayments: Array<{
    id: string;
    dueDate: string;
    amount: number;
    counterparty: string | null;
    category: string;
  }>;
  relevantInflows: Array<{
    id: string;
    dueDate: string;
    amount: number;
    counterparty: string | null;
    category: string;
  }>;
  marketSignals: Array<{
    id: string;
    title: string;
    signalDate: string;
    sourceName: string;
    description: string | null;
    sector: string | null;
    impactScore: number | null;
  }>;
  drivers: string[];
  recommendations: string[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<DashboardSummary>("/dashboard/summary")
      .then(setData)
      .catch((fetchError) => setError(fetchError instanceof Error ? fetchError.message : "Error"));
  }, []);

  return (
    <AppShell title="Dashboard principal">
      {error ? <Panel>{error}</Panel> : null}
      {!data ? (
        <Panel>Cargando métricas...</Panel>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-4">
            <StatCard label="Saldo actual" value={`${data.currentCashBalance.toFixed(2)} €`} />
            <StatCard
              label="Caja 30 días"
              tone={data.projectedBalances[30] < 0 ? "danger" : "default"}
              value={`${data.projectedBalances[30].toFixed(2)} €`}
            />
            <StatCard
              label="Caja 60 días"
              tone={data.projectedBalances[60] < 0 ? "danger" : "warning"}
              value={`${data.projectedBalances[60].toFixed(2)} €`}
            />
            <StatCard
              label="Caja 90 días"
              tone={data.projectedBalances[90] < 0 ? "danger" : "warning"}
              value={`${data.projectedBalances[90].toFixed(2)} €`}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
            <Panel>
              <div className="mb-4">
                <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Caja proyectada</p>
                <h3 className="mt-2 text-2xl font-semibold">Curva diaria a 90 días</h3>
              </div>
              <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.timeline}>
                    <defs>
                      <linearGradient id="cashGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#0f766e" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#0f766e" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#d6d3d1" strokeDasharray="3 3" />
                    <XAxis dataKey="date" minTickGap={28} />
                    <YAxis />
                    <Tooltip />
                    <Area dataKey="balance" fill="url(#cashGradient)" stroke="#0f766e" type="monotone" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel>
              <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Riesgo</p>
              <div className="mt-4 space-y-4">
                {data.riskByHorizon.map((risk) => (
                  <div className="rounded-3xl bg-[var(--surface-strong)] p-4" key={risk.horizonDays}>
                    <p className="text-sm text-stone-500">{risk.horizonDays} días</p>
                    <p className="mt-2 text-2xl font-semibold">{risk.riskLevel}</p>
                    <p className="mt-2 text-stone-700">
                      Tensión: {risk.tensionProbability.toFixed(1)}% | Rotura: {risk.breakProbability.toFixed(1)}%
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <div className="grid gap-6 lg:grid-cols-4">
            <Panel>
              <h3 className="text-xl font-semibold">Próximos pagos críticos</h3>
              <div className="mt-4 space-y-3">
                {data.criticalPayments.map((item) => (
                  <div className="rounded-2xl bg-[var(--surface-strong)] p-4" key={item.id}>
                    <p className="font-semibold">{item.counterparty ?? item.category}</p>
                    <p className="text-stone-600">{new Date(item.dueDate).toLocaleDateString("es-ES")}</p>
                    <p className="mt-2 text-orange-700">{item.amount.toFixed(2)} €</p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel>
              <h3 className="text-xl font-semibold">Cobros relevantes</h3>
              <div className="mt-4 space-y-3">
                {data.relevantInflows.map((item) => (
                  <div className="rounded-2xl bg-[var(--surface-strong)] p-4" key={item.id}>
                    <p className="font-semibold">{item.counterparty ?? item.category}</p>
                    <p className="text-stone-600">{new Date(item.dueDate).toLocaleDateString("es-ES")}</p>
                    <p className="mt-2 text-green-700">{item.amount.toFixed(2)} €</p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel>
              <h3 className="text-xl font-semibold">Drivers y recomendaciones</h3>
              <div className="mt-4 space-y-4 text-stone-700">
                {data.drivers.map((driver) => (
                  <p key={driver}>• {driver}</p>
                ))}
                <div className="border-t border-stone-300 pt-4">
                  {data.recommendations.map((recommendation) => (
                    <p key={recommendation}>• {recommendation}</p>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel>
              <h3 className="text-xl font-semibold">Señales externas</h3>
              <div className="mt-4 space-y-3 text-stone-700">
                {data.marketSignals.map((signal) => (
                  <div className="rounded-2xl bg-[var(--surface-strong)] p-4" key={signal.id}>
                    <p className="font-semibold">{signal.title}</p>
                    <p className="text-sm text-stone-500">
                      {signal.sourceName} · {new Date(signal.signalDate).toLocaleDateString("es-ES")}
                    </p>
                    <p className="mt-2 text-sm">
                      {signal.description ?? "Sin descripción adicional."}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      )}
    </AppShell>
  );
}
