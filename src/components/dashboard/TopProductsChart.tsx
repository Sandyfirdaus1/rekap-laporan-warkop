"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TopProduct = {
  id: string;
  name: string;
  qty: number;
};

const COLORS = ["#2d6a4f", "#40916c", "#52b788", "#74c69d", "#95d5b2"];

export function TopProductsChart({ data }: { data: TopProduct[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-[var(--muted)]">
        Belum ada data penjualan
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 36, left: 4, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,124,114,0.12)" horizontal vertical={false} />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#6b7c72", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: "rgba(45,106,79,0.06)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as TopProduct;
              return (
                <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 shadow-lg">
                  <p className="text-sm font-semibold">{row.name}</p>
                  <p className="text-xs text-[var(--accent)]">Terjual: {row.qty}</p>
                </div>
              );
            }}
          />
          <Bar dataKey="qty" radius={[0, 6, 6, 0]} barSize={22}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
            <LabelList dataKey="qty" position="right" fill="#6b7c72" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
