"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../../../components/app-shell";
import {
  FieldLabel,
  Panel,
  PrimaryButton,
  TextInput,
} from "../../../components/ui";
import { apiFetch } from "../../../lib/api";

export default function SettingsPage() {
  const [form, setForm] = useState({
    currency: "EUR",
    sector: "",
    tensionThresholdAmount: 5000,
    tensionThresholdDays: 14,
    monteCarloRuns: 1000,
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiFetch<{
      profile: { currency: string; sector: string | null };
      settings: {
        tensionThresholdAmount: string;
        tensionThresholdDays: number;
        monteCarloRuns: number;
      };
    }>("/organizations/current").then((organization) => {
      setForm({
        currency: organization.profile.currency,
        sector: organization.profile.sector ?? "",
        tensionThresholdAmount: Number(organization.settings.tensionThresholdAmount),
        tensionThresholdDays: organization.settings.tensionThresholdDays,
        monteCarloRuns: organization.settings.monteCarloRuns,
      });
    });
  }, []);

  const save = async () => {
    await apiFetch("/organizations/current", {
      method: "PATCH",
      body: JSON.stringify(form),
    });
    setMessage("Configuración guardada.");
  };

  return (
    <AppShell title="Configuración de riesgo y simulación">
      <Panel className="max-w-3xl">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <FieldLabel>Moneda</FieldLabel>
            <TextInput onChange={(e) => setForm({ ...form, currency: e.target.value })} value={form.currency} />
          </div>
          <div>
            <FieldLabel>Sector</FieldLabel>
            <TextInput onChange={(e) => setForm({ ...form, sector: e.target.value })} value={form.sector} />
          </div>
          <div>
            <FieldLabel>Umbral de tensión</FieldLabel>
            <TextInput onChange={(e) => setForm({ ...form, tensionThresholdAmount: Number(e.target.value) })} type="number" value={String(form.tensionThresholdAmount)} />
          </div>
          <div>
            <FieldLabel>Ventana crítica en días</FieldLabel>
            <TextInput onChange={(e) => setForm({ ...form, tensionThresholdDays: Number(e.target.value) })} type="number" value={String(form.tensionThresholdDays)} />
          </div>
          <div>
            <FieldLabel>Simulaciones Monte Carlo</FieldLabel>
            <TextInput onChange={(e) => setForm({ ...form, monteCarloRuns: Number(e.target.value) })} type="number" value={String(form.monteCarloRuns)} />
          </div>
        </div>
        <PrimaryButton className="mt-6" onClick={save} type="button">
          Guardar cambios
        </PrimaryButton>
        {message ? <p className="mt-4 text-green-700">{message}</p> : null}
      </Panel>
    </AppShell>
  );
}
