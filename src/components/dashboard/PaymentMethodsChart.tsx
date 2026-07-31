"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { idr } from "@/lib/format";

type PaymentMethodStat = {
  method: string;
  count: number;
  total: number;
};

const COLORS = ["#fbbf24", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6"];

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
  const RADIAN = Math.PI / 180;
  // Calculate position for the label
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // Don't show label for very small slices

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={600}
      className="drop-shadow-md"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function PaymentMethodsChart({ data }: { data: PaymentMethodStat[] }) {
  // Filter out empty ones if any
  const chartData = data.filter((d) => d.count > 0);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={0}
            outerRadius={100}
            paddingAngle={2}
            dataKey="count"
            nameKey="method"
            labelLine={false}
            label={renderCustomizedLabel}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as PaymentMethodStat;
              return (
                <div className="rounded-xl border border-[var(--card-border)] bg-[#1a1814] px-3 py-2 shadow-xl">
                  <p className="text-sm font-semibold text-[var(--foreground)] capitalize">{row.method}</p>
                  <p className="text-xs text-[var(--muted)] mt-1">Total: {idr(row.total)}</p>
                  <p className="text-xs text-[var(--muted)]">Jumlah: {row.count} trx</p>
                </div>
              );
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-xs text-[var(--muted)] capitalize">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
