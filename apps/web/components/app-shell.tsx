"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession } from "../lib/api";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/imports", label: "Importación" },
  { href: "/movements", label: "Movimientos" },
  { href: "/scenarios", label: "Escenarios" },
  { href: "/settings", label: "Configuración" },
];

export function AppShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-transparent text-stone-900">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-8">
        <aside className="hidden w-64 shrink-0 rounded-[28px] border border-stone-300/70 bg-[var(--surface)] p-5 shadow-[0_24px_80px_rgba(24,32,40,0.08)] lg:block">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.3em] text-teal-700">Mathing</p>
            <h1 className="mt-2 text-3xl font-semibold">Caja predictiva</h1>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  className={`block rounded-2xl px-4 py-3 transition ${
                    active
                      ? "bg-teal-700 text-white"
                      : "bg-[var(--surface-strong)] text-stone-700 hover:bg-stone-200"
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <button
            className="mt-8 w-full rounded-2xl border border-stone-300 px-4 py-3 text-left text-stone-700"
            onClick={() => {
              clearSession();
              router.replace("/login");
            }}
            type="button"
          >
            Cerrar sesión
          </button>
        </aside>

        <main className="flex-1">
          <header className="mb-6 rounded-[28px] border border-stone-300/70 bg-[var(--surface)] p-6 shadow-[0_18px_60px_rgba(24,32,40,0.06)]">
            <p className="text-sm uppercase tracking-[0.3em] text-stone-500">MVP B2B</p>
            <h2 className="mt-2 text-4xl font-semibold">{title}</h2>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
