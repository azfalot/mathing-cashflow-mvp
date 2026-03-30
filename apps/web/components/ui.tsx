import { clsx } from "clsx";

export function Panel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={clsx(
        "rounded-[28px] border border-stone-300/70 bg-[var(--surface)] p-6 shadow-[0_18px_60px_rgba(24,32,40,0.06)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "danger" | "warning" | "success";
}) {
  const toneClass =
    tone === "danger"
      ? "text-orange-700"
      : tone === "warning"
        ? "text-amber-700"
        : tone === "success"
          ? "text-green-700"
          : "text-stone-900";

  return (
    <Panel className="space-y-3">
      <p className="text-sm uppercase tracking-[0.2em] text-stone-500">{label}</p>
      <p className={clsx("text-4xl font-semibold", toneClass)}>{value}</p>
    </Panel>
  );
}

export function FieldLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={clsx("mb-2 block text-sm uppercase tracking-[0.18em] text-stone-500", className)}>
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        "w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-teal-600",
        props.className,
      )}
    />
  );
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx(
        "w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-teal-600",
        props.className,
      )}
    />
  );
}

export function PrimaryButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>,
) {
  return (
    <button
      {...props}
      className={clsx(
        "rounded-2xl bg-teal-700 px-5 py-3 text-white transition hover:bg-teal-800 disabled:opacity-60",
        props.className,
      )}
    />
  );
}
