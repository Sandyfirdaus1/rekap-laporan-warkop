import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  accent?: "default" | "emerald" | "sky" | "amber";
}) {
  const iconWrap =
    accent === "emerald"
      ? "bg-emerald-500/15 text-emerald-400"
      : accent === "sky"
        ? "bg-sky-500/15 text-sky-400"
        : accent === "amber"
          ? "bg-[var(--accent)]/15 text-[var(--accent)]"
          : "bg-white/10 text-[var(--foreground)]";

  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)]/60 p-4 shadow-lg shadow-black/20 backdrop-blur-sm sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-[var(--muted)] sm:text-sm">{label}</p>
        <span className={`rounded-xl p-2 ${iconWrap}`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </span>
      </div>
      <p className="mt-2 font-display text-2xl font-semibold tabular-nums sm:text-3xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}
