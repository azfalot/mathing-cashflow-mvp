"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, setSession } from "../../lib/api";
import { FieldLabel, Panel, PrimaryButton, TextInput } from "../../components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: "admin@demo.local",
    password: "Demo1234!",
    fullName: "Admin Demo",
    organizationName: "Acme Industrial",
    currency: "EUR",
    country: "ES",
    sector: "Servicios",
  });

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const session = await apiFetch<{
        accessToken: string;
        user: {
          id: string;
          email: string;
          fullName: string;
          organizationId: string;
          role: "ADMIN" | "ANALYST";
        };
      }>(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(
          mode === "login"
            ? { email: form.email, password: form.password }
            : form,
        ),
      });
      setSession(session);
      router.replace("/dashboard");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "No se pudo iniciar sesión",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[32px] border border-stone-300/60 bg-[var(--surface)] p-8 shadow-[0_24px_90px_rgba(24,32,40,0.08)]">
          <p className="text-sm uppercase tracking-[0.3em] text-teal-700">Mathing</p>
          <h1 className="mt-4 max-w-xl text-5xl font-semibold leading-tight">
            Predicción de tensión de caja con explicaciones accionables.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-stone-600">
            Carga CSVs, normaliza movimientos, proyecta caja a 90 días y simula decisiones financieras antes de ejecutarlas.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              "Forecast diario hasta 90 días",
              "Riesgo interpretable con Monte Carlo",
              "Escenarios what-if comparables",
            ].map((item) => (
              <div
                className="rounded-3xl bg-[var(--surface-strong)] px-5 py-6 text-stone-700"
                key={item}
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <Panel className="self-center">
          <div className="mb-6 flex gap-2 rounded-2xl bg-[var(--surface-strong)] p-2">
            <button
              className={`flex-1 rounded-2xl px-4 py-3 ${mode === "login" ? "bg-white" : ""}`}
              onClick={() => setMode("login")}
              type="button"
            >
              Login
            </button>
            <button
              className={`flex-1 rounded-2xl px-4 py-3 ${mode === "register" ? "bg-white" : ""}`}
              onClick={() => setMode("register")}
              type="button"
            >
              Registro
            </button>
          </div>

          {mode === "register" && (
            <>
              <FieldLabel>Organización</FieldLabel>
              <TextInput
                onChange={(event) =>
                  setForm((current) => ({ ...current, organizationName: event.target.value }))
                }
                value={form.organizationName}
              />
            </>
          )}

          {mode === "register" && (
            <>
              <FieldLabel>Nombre completo</FieldLabel>
              <TextInput
                onChange={(event) =>
                  setForm((current) => ({ ...current, fullName: event.target.value }))
                }
                value={form.fullName}
              />
            </>
          )}

          <FieldLabel>Email</FieldLabel>
          <TextInput
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
            value={form.email}
          />

          <FieldLabel>Contraseña</FieldLabel>
          <TextInput
            onChange={(event) =>
              setForm((current) => ({ ...current, password: event.target.value }))
            }
            type="password"
            value={form.password}
          />

          {error ? <p className="mt-4 text-sm text-orange-700">{error}</p> : null}

          <PrimaryButton className="mt-6 w-full" disabled={loading} onClick={submit} type="button">
            {loading ? "Procesando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
          </PrimaryButton>

          <p className="mt-4 text-sm text-stone-500">
            Credenciales demo tras seed: `admin@demo.local` / `Demo1234!`
          </p>
        </Panel>
      </div>
    </main>
  );
}
