"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
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
    const hm = parts[parts.length - 1] ?? full;
    return hm;
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
    if (mode === "month") {
      return `${d}`;
    }
  }

  if (parts.length === 2) {
    const [, m] = parts;
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return months[m - 1] ?? full;
  }

  return full;
}

const legendNames: Record<string, string> = {
  revenue: "Pendapatan (IDR)",
};

export function SalesComboChart({
  data,
  mode,
}: {
  data: ChartRow[];
  mode: "today" | "week" | "month" | "year";
}) {
  const axisRevenue = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`;
    if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
    return String(v);
  };

  return (
    <div className="space-y-3">
      <div className="h-[min(400px,55vh)] w-full min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="barTx" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.1)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#9c8f7e", fontSize: 10 }}
            tickFormatter={(v) => shortLabel(String(v), mode)}
            interval="preserveStartEnd"
            minTickGap={12}
          />
          <YAxis
            yAxisId="rev"
            tick={{ fill: "#fbbf24", fontSize: 10 }}
            tickFormatter={axisRevenue}
            width={44}
          />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload as ChartRow;
                return (
                  <div className="max-w-[240px] rounded-xl border border-[var(--card-border)] bg-[#1a1814] px-3 py-2 shadow-xl">
                    <p className="text-xs text-[var(--muted)]">{label}</p>
                    <p className="text-sm font-semibold text-[var(--accent)]">
                      Pendapatan: {idr(row.revenue)}
                    </p>
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              formatter={(value) => legendNames[value] ?? value}
            />

          <Line
            yAxisId="rev"
            type="monotone"
            dataKey="revenue"
            name="revenue"
            stroke="#fbbf24"
            strokeWidth={3}
            dot={{ r: 3, fill: "#fbbf24", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
