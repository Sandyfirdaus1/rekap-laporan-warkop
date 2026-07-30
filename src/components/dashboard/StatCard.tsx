export function StatCard({
  label,
  value,
  hint,
  accent = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "default" | "emerald" | "sky" | "amber";
}) {
  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)]/60 p-4 shadow-lg shadow-black/20 backdrop-blur-sm sm:p-5">
      <p className="text-xs font-medium text-[var(--muted)] sm:text-sm">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold tabular-nums sm:text-3xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}
