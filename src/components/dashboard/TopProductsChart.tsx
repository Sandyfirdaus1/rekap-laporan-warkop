"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LabelList,
} from "recharts";

type TopProduct = {
  id: string;
  name: string;
  qty: number;
};

export function TopProductsChart({ data }: { data: TopProduct[] }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#a8a29e", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as TopProduct;
              return (
                <div className="rounded-xl border border-[var(--card-border)] bg-[#1a1814] px-3 py-2 shadow-xl">
                  <p className="text-sm font-semibold text-[var(--foreground)]">{row.name}</p>
                  <p className="text-xs text-amber-400">Terjual: {row.qty}</p>
                </div>
              );
            }}
          />
          <Bar dataKey="qty" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={24}>
            <LabelList dataKey="qty" position="right" fill="#d6d3d1" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
