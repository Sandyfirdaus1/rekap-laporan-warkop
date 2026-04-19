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
  const tabMeta = tabs.find((t) => t.id === active)!;

  return (
    <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)]/45 shadow-xl backdrop-blur-sm">
      <div className="border-b border-[var(--card-border)] px-4 py-3 sm:px-5">
        <h2 className="font-display text-lg font-semibold">Stok barang</h2>
        <p className="mt-0.5 text-xs text-[var(--muted)]">
          Daftar per status: tersedia (stok &gt; min), hampir habis, habis.
        </p>
      </div>

      <div className="flex gap-1 overflow-x-auto p-2 sm:p-3">
        {tabs.map((t) => {
          const count = lists[t.id].length;
          const isOn = active === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive(t.id)}
              className={clsx(
                "flex min-w-[7.5rem] shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all sm:min-w-0 sm:flex-1",
                !isOn && "bg-black/20 text-[var(--muted)] hover:bg-white/5",
                isOn &&
                  t.tone === "emerald" &&
                  "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/30",
                isOn &&
                  t.tone === "amber" &&
                  "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/30",
                isOn && t.tone === "red" && "bg-red-500/15 text-red-200 ring-1 ring-red-500/30"
              )}
            >
              <t.Icon className="h-4 w-4 shrink-0 opacity-90" />
              <span className="leading-tight">
                {t.label}
                <span className="mt-0.5 block text-xs font-normal tabular-nums opacity-80">
                  {count} item
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div
        className={clsx(
          "max-h-[min(320px,50vh)] overflow-y-auto px-4 pb-4 sm:px-5",
          tabMeta.tone === "emerald" && "border-t border-emerald-500/10",
          tabMeta.tone === "amber" && "border-t border-amber-500/10",
          tabMeta.tone === "red" && "border-t border-red-500/10"
        )}
      >
        {current.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--muted)]">
            {active === "available" && "Belum ada barang dengan stok di atas minimum."}
            {active === "lowStock" && "Tidak ada barang yang hampir habis."}
            {active === "outOfStock" && "Tidak ada barang yang stoknya nol."}
          </p>
        ) : (
          <ul className="divide-y divide-[var(--card-border)]/80">
            {current.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm first:pt-2"
              >
                <span className="min-w-0 flex-1 font-medium">
                  {p.name}
                  <span className="ml-2 text-xs font-normal text-[var(--muted)]">{p.unit}</span>
                </span>
                <span className="tabular-nums text-[var(--foreground)]">
                  Stok <strong>{p.stock}</strong>
                  {active !== "outOfStock" && (
                    <span className="text-[var(--muted)]"> / min {p.minStock}</span>
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
