"use client";

import { useState } from "react";
import { AlertTriangle, Ban, CheckCircle2 } from "lucide-react";
import clsx from "clsx";

export type StockRow = { id: string; name: string; unit: string; stock: number; minStock: number };

const tabs = [
  { id: "available" as const, label: "Tersedia", Icon: CheckCircle2, tone: "emerald" },
  { id: "lowStock" as const, label: "Hampir habis", Icon: AlertTriangle, tone: "amber" },
  { id: "outOfStock" as const, label: "Habis", Icon: Ban, tone: "red" },
];

export function StockByStatusPanel({
  available,
  lowStock,
  outOfStock,
}: {
  available: StockRow[];
  lowStock: StockRow[];
  outOfStock: StockRow[];
}) {
  const [active, setActive] = useState<(typeof tabs)[number]["id"]>("available");
  const lists = { available, lowStock, outOfStock };
  const current = lists[active];

  return (
    <section className="card-surface overflow-hidden">
      <div className="border-b border-[var(--card-border)] px-5 py-4">
        <h2 className="text-base font-semibold">Stok barang</h2>
        <p className="mt-0.5 text-xs text-[var(--muted)]">Status inventori per kategori</p>
      </div>

      <div className="flex gap-1 overflow-x-auto p-3">
        {tabs.map((t) => {
          const count = lists[t.id].length;
          const isOn = active === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive(t.id)}
              className={clsx(
                "flex min-w-[7rem] shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all sm:flex-1",
                !isOn && "bg-[var(--surface-hover)] text-[var(--muted)]",
                isOn && t.tone === "emerald" && "bg-emerald-50 text-emerald-700",
                isOn && t.tone === "amber" && "bg-amber-50 text-amber-700",
                isOn && t.tone === "red" && "bg-red-50 text-red-700"
              )}
            >
              <t.Icon className="h-4 w-4" />
              <span>
                {t.label}
                <span className="ml-1 text-xs opacity-70">({count})</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="max-h-64 overflow-y-auto border-t border-[var(--card-border)] px-5 pb-4">
        {current.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--muted)]">Tidak ada item.</p>
        ) : (
          <ul className="divide-y divide-[var(--card-border)]">
            {current.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 py-3 text-sm">
                <span className="font-medium">
                  {p.name}
                  <span className="ml-2 text-xs font-normal text-[var(--muted)]">{p.unit}</span>
                </span>
                <span className="tabular-nums">
                  <strong>{p.stock}</strong>
                  {active !== "outOfStock" && (
                    <span className="text-[var(--muted)]"> / {p.minStock}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
