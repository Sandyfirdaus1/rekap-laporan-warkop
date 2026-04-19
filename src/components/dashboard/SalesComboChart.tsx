"use client";

import { useState } from "react";
import { Check } from "lucide-react";
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

type VisibleSeries = {
  revenue: boolean;
  transactions: boolean;
  qtySold: boolean;
  qtyStockOut: boolean;
};

export type ChartRow = {
  label: string;
  revenue: number;
  transactions: number;
  qtySold: number;
  qtyStockOut: number;
  totalQtyOut: number;
};

function shortLabel(full: string, mode: "today" | "week" | "month") {
  if (mode === "today") {
    const parts = full.split(" ");
    const hm = parts[parts.length - 1]?.replace(":00", "h") ?? full;
    return hm;
  }
  const [, m, d] = full.split("-");
  if (d && m) return `${d}/${m}`;
  return full;
}

type ChartStyle = "combo" | "lines" | "bars";

const legendNames: Record<string, string> = {
  revenue: "Pemasukan (IDR)",
  transactions: "Transaksi jual",
  qtySold: "Unit terjual",
  qtyStockOut: "Keluar (non-jual)",
};

export function SalesComboChart({
  data,
  mode,
}: {
  data: ChartRow[];
  mode: "today" | "week" | "month";
}) {
  const [style, setStyle] = useState<ChartStyle>("combo");
  const [visible, setVisible] = useState<VisibleSeries>({
    revenue: true,
    transactions: true,
    qtySold: true,
    qtyStockOut: true,
  });

  const toggleSeries = (key: keyof VisibleSeries) => {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const axisRevenue = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`;
    if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
    return String(v);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[var(--muted)]">
          Pemasukan, transaksi jual, dan unit barang keluar (terjual + non-jual) per{" "}
          {mode === "today" ? "jam" : "hari"}
        </p>
        <div className="flex rounded-xl bg-black/25 p-0.5 ring-1 ring-[var(--card-border)]">
          {(
            [
              ["combo", "Campuran"],
              ["lines", "Garis"],
              ["bars", "Batang"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setStyle(id)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors sm:px-3 sm:text-xs ${
                style === id
                  ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {[
          ["revenue", "Pemasukan", "#fbbf24"],
          ["transactions", "Transaksi", "#3b82f6"],
          ["qtySold", "Unit terjual", "#14b8a6"],
          ["qtyStockOut", "Keluar non-jual", "#f97316"],
        ].map(([key, label, color]) => (
          <button
            key={key}
            type="button"
            onClick={() => toggleSeries(key as keyof VisibleSeries)}
            className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] transition-colors sm:px-2.5 sm:text-xs ${
              visible[key as keyof VisibleSeries]
                ? "border-[var(--card-border)] bg-white/5 text-[var(--foreground)]"
                : "border-transparent bg-black/25 text-[var(--muted)]"
            }`}
          >
            <div
              className="h-3 w-3 rounded flex items-center justify-center"
              style={{ backgroundColor: visible[key as keyof VisibleSeries] ? color : "transparent", border: `1.5px solid ${color}` }}
            >
              {visible[key as keyof VisibleSeries] && <Check className="h-2 w-2 text-white" />}
            </div>
            {label}
          </button>
        ))}
      </div>

      <div className="h-[min(400px,55vh)] w-full min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="barTx" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.45} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.1)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#9c8f7e", fontSize: 10 }}
              tickFormatter={(v) => shortLabel(String(v), mode)}
              interval="preserveStartEnd"
              minTickGap={16}
            />
            <YAxis
              yAxisId="rev"
              tick={{ fill: "#fbbf24", fontSize: 10 }}
              tickFormatter={axisRevenue}
              width={44}
            />
            <YAxis
              yAxisId="qty"
              orientation="right"
              tick={{ fill: "#14b8a6", fontSize: 10 }}
              allowDecimals={false}
              width={36}
            />
            <YAxis
              yAxisId="tx"
              orientation="right"
              offset={52}
              tick={{ fill: "#3b82f6", fontSize: 10 }}
              allowDecimals={false}
              width={26}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload as ChartRow;
                return (
                  <div className="max-w-[240px] rounded-xl border border-[var(--card-border)] bg-[#1a1814] px-3 py-2 shadow-xl">
                    <p className="text-xs text-[var(--muted)]">{label}</p>
                    <p className="text-sm font-semibold text-[var(--accent)]">
                      Pemasukan: {idr(row.revenue)}
                    </p>
                    <p className="text-xs text-sky-300">Transaksi jual: {row.transactions}</p>
                    <p className="text-xs text-teal-300">Unit terjual: {row.qtySold}</p>
                    <p className="text-xs text-orange-300">Keluar non-jual: {row.qtyStockOut}</p>
                    <p className="text-xs text-[var(--muted)]">
                      Total unit keluar: {row.totalQtyOut}
                    </p>
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              formatter={(value) => legendNames[value] ?? value}
            />

            {style === "bars" && (
              <>
                {visible.qtySold && (
                  <Bar
                    yAxisId="qty"
                    dataKey="qtySold"
                    stackId="out"
                    fill="#14b8a6"
                    fillOpacity={1}
                    name="qtySold"
                    radius={[0, 0, 0, 0]}
                  />
                )}
                {visible.qtyStockOut && (
                  <Bar
                    yAxisId="qty"
                    dataKey="qtyStockOut"
                    stackId="out"
                    fill="#f97316"
                    fillOpacity={1}
                    name="qtyStockOut"
                    radius={[4, 4, 0, 0]}
                  />
                )}
              </>
            )}

            {style === "lines" && (
              <>
                {visible.revenue && (
                  <Line
                    yAxisId="rev"
                    type="monotone"
                    dataKey="revenue"
                    name="revenue"
                    stroke="#fbbf24"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                )}
                {visible.transactions && (
                  <Line
                    yAxisId="tx"
                    type="monotone"
                    dataKey="transactions"
                    name="transactions"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                )}
                {visible.qtySold && (
                  <Line
                    yAxisId="qty"
                    type="monotone"
                    dataKey="qtySold"
                    name="qtySold"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    dot={false}
                  />
                )}
                {visible.qtyStockOut && (
                  <Line
                    yAxisId="qty"
                    type="monotone"
                    dataKey="qtyStockOut"
                    name="qtyStockOut"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={false}
                  />
                )}
              </>
            )}

            {style === "combo" && (
              <>
                {visible.qtySold && (
                  <Bar
                    yAxisId="qty"
                    dataKey="qtySold"
                    stackId="out"
                    fill="#14b8a6"
                    fillOpacity={1}
                    name="qtySold"
                    radius={[0, 0, 0, 0]}
                  />
                )}
                {visible.qtyStockOut && (
                  <Bar
                    yAxisId="qty"
                    dataKey="qtyStockOut"
                    stackId="out"
                    fill="#f97316"
                    fillOpacity={1}
                    name="qtyStockOut"
                    radius={[4, 4, 0, 0]}
                  />
                )}
                {visible.transactions && (
                  <Line
                    yAxisId="tx"
                    type="monotone"
                    dataKey="transactions"
                    name="transactions"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="6 4"
                  />
                )}
                {visible.revenue && (
                  <Line
                    yAxisId="rev"
                    type="monotone"
                    dataKey="revenue"
                    name="revenue"
                    stroke="#fbbf24"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                )}
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
