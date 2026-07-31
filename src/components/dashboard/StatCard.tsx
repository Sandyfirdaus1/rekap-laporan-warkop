import clsx from "clsx";

export function StatCard({
  label,
  value,
  hint,
  accent = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "default" | "emerald" | "sky" | "amber" | "rose";
}) {
  const accentStyles = {
    default: "border-[var(--card-border)] bg-[var(--card)]/60 text-[var(--foreground)]",
    emerald: "border-emerald-500/25 bg-emerald-500/5 text-emerald-400 shadow-emerald-950/20",
    sky: "border-sky-500/25 bg-sky-500/5 text-sky-400 shadow-sky-950/20",
    amber: "border-amber-500/25 bg-amber-500/5 text-amber-400 shadow-amber-950/20",
    rose: "border-rose-500/25 bg-rose-500/5 text-rose-400 shadow-rose-950/20",
  };

  const valueStyles = {
    default: "text-[var(--foreground)]",
    emerald: "text-emerald-300",
    sky: "text-sky-300",
    amber: "text-amber-300",
    rose: "text-rose-300",
  };

  return (
    <div
      className={clsx(
        "group relative overflow-hidden rounded-2xl border p-4 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl backdrop-blur-sm sm:p-5",
        accentStyles[accent]
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-[var(--muted)] sm:text-sm">{label}</p>
      </div>
      <p className={clsx("mt-2 font-display text-2xl font-semibold tabular-nums sm:text-3xl", valueStyles[accent])}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-[var(--muted)] opacity-90">{hint}</p> : null}
    </div>
  );
}
