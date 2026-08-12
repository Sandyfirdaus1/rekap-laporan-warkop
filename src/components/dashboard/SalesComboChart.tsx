"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { idr } from "@/lib/format";

export type ChartRow = {
  label: string;
  revenue: number;
  transactions: number;
};

function shortLabel(full: string, mode: "today" | "week" | "month" | "year") {
  if (mode === "today") {
    const parts = full.split(" ");
    return parts[parts.length - 1] ?? full;
  }
  if (!full) return "";

  const parts = full.split("-").map(Number);
  if (parts.length === 3) {
    const [y, m, d] = parts;
    if (mode === "week") {
      const date = new Date(y, m - 1, d);
      const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
      return `${days[date.getDay()]} ${d}`;
    }
    if (mode === "month") return `${d}`;
  }

  if (parts.length === 2) {
    const [, mo] = parts;
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return months[mo - 1] ?? full;
  }

  return full;
}

const fmtRevenue = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`;
  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
  return String(v);
};

export function SalesComboChart({
  data,
  mode,
}: {
  data: ChartRow[];
  mode: "today" | "week" | "month" | "year";
}) {
  const slantedLabels = mode === "today";
  const showAllLabels = mode === "today" || mode === "month";

  return (
    <div className={`w-full min-h-[260px] ${slantedLabels ? "h-[360px]" : showAllLabels ? "h-[340px]" : "h-[320px]"}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: -8, bottom: slantedLabels ? 28 : showAllLabels ? 8 : 0 }}
          barCategoryGap={mode === "month" ? "8%" : "20%"}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,124,114,0.12)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#6b7c72", fontSize: mode === "month" ? 9 : slantedLabels ? 10 : 11 }}
            tickFormatter={(v) => shortLabel(String(v), mode)}
            interval={showAllLabels ? 0 : "preserveStartEnd"}
            minTickGap={showAllLabels ? 0 : 16}
            angle={slantedLabels ? -45 : 0}
            textAnchor={slantedLabels ? "end" : "middle"}
            height={slantedLabels ? 56 : mode === "month" ? 36 : 30}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#6b7c72", fontSize: 11 }}
            tickFormatter={fmtRevenue}
            width={48}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as ChartRow;
              return (
                <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 shadow-lg">
                  <p className="mb-1 text-xs text-[var(--muted)]">{label}</p>
                  <p className="text-sm font-semibold text-[#2d6a4f]">
                    Pendapatan: {idr(row.revenue)}
                  </p>
                </div>
              );
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
            formatter={() => "Pendapatan"}
          />
          <Bar
            dataKey="revenue"
            name="revenue"
            fill="#2d6a4f"
            radius={[4, 4, 0, 0]}
            maxBarSize={mode === "month" ? 14 : 40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
