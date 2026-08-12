import clsx from "clsx";
import { LucideIcon } from "lucide-react";

const iconStyles = {
  green: "bg-emerald-50 text-emerald-600",
  blue: "bg-sky-50 text-sky-600",
  orange: "bg-orange-50 text-orange-600",
  purple: "bg-violet-50 text-violet-600",
  red: "bg-red-50 text-red-600",
  gray: "bg-[var(--surface-hover)] text-[var(--muted)]",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  iconColor = "green",
  badge,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  iconColor?: keyof typeof iconStyles;
  badge?: { text: string; positive?: boolean };
}) {
  return (
    <div className="card-surface flex flex-col p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className={clsx("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", iconStyles[iconColor])}>
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
        {badge && (
          <span
            className={clsx(
              "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
              badge.positive !== false
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-600"
            )}
          >
            {badge.text}
          </span>
        )}
      </div>
      <p className="mt-4 text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-[var(--foreground)]">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p>}
    </div>
  );
}
