"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Banknote, Smartphone, CreditCard } from "lucide-react";
import { idr } from "@/lib/format";

type PaymentMethodStat = {
  method: string;
  count: number;
  total: number;
};

type ChartSlice = PaymentMethodStat & {
  percent: number;
  color: string;
  bgColor: string;
  label: string;
  Icon: typeof Banknote;
};

const METHOD_META: Record<
  string,
  { label: string; color: string; bgColor: string; Icon: typeof Banknote }
> = {
  cash: { label: "Cash", color: "#2d6a4f", bgColor: "#d8f3dc", Icon: Banknote },
  qris: { label: "QRIS", color: "#2563eb", bgColor: "#dbeafe", Icon: Smartphone },
};

const FALLBACK = [
  { color: "#7c3aed", bgColor: "#ede9fe", Icon: CreditCard },
  { color: "#ea580c", bgColor: "#ffedd5", Icon: CreditCard },
];

function getMeta(method: string, index: number) {
  const key = method.toLowerCase();
  if (METHOD_META[key]) return METHOD_META[key];
  const fb = FALLBACK[index % FALLBACK.length];
  return { label: method, ...fb };
}

export function PaymentMethodsChart({ data }: { data: PaymentMethodStat[] }) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const filtered = data.filter((d) => d.count > 0);
  const totalCount = filtered.reduce((sum, d) => sum + d.count, 0);

  const chartData: ChartSlice[] = filtered.map((item, index) => {
    const meta = getMeta(item.method, index);
    return {
      ...item,
      percent: totalCount > 0 ? (item.count / totalCount) * 100 : 0,
      color: meta.color,
      bgColor: meta.bgColor,
      label: meta.label,
      Icon: meta.Icon,
    };
  });

  if (chartData.length === 0) {
    return (
      <div className="flex h-[260px] flex-col items-center justify-center text-center text-sm text-[var(--muted)]">
        <CreditCard className="mb-2 h-8 w-8 opacity-40" />
        Belum ada data pembayaran
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      {/* Legend — kiri seperti referensi */}
      <div className="grid w-full shrink-0 grid-cols-2 gap-x-6 gap-y-3 sm:max-w-[220px] sm:grid-cols-1">
        {chartData.map((item, index) => {
          const Icon = item.Icon;
          const isActive = activeIndex === index;
          return (
            <button
              key={item.method}
              type="button"
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(undefined)}
              className="flex items-center gap-2.5 text-left transition-opacity"
              style={{ opacity: activeIndex === undefined || isActive ? 1 : 0.45 }}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: item.bgColor, color: item.color }}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">{item.label}</p>
                <p className="text-xs font-semibold tabular-nums text-[var(--muted)]">
                  {item.percent.toFixed(0)}%
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Donut — kanan */}
      <div className="relative mx-auto h-[220px] w-full max-w-[220px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={88}
              paddingAngle={chartData.length > 1 ? 3 : 0}
              dataKey="count"
              onMouseEnter={(_, i) => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(undefined)}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.color}
                  opacity={activeIndex === undefined || activeIndex === index ? 1 : 0.35}
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload as ChartSlice;
                return (
                  <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 shadow-lg text-xs">
                    <p className="font-semibold">{row.label}</p>
                    <p className="text-[var(--muted)]">{row.count} trx · {idr(row.total)}</p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
