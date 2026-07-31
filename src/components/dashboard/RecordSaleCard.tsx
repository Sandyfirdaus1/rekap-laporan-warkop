"use client";

import { Loader2, Plus, Receipt } from "lucide-react";
import { QtyLineRows, type LineDraft, type ProductOption } from "@/components/QtyLineRows";

export type { LineDraft, ProductOption };

export function RecordSaleCard({
  products,
  lines,
  saleBusy,
  saleMsg,
  onAddLine,
  onSetLine,
  onRemoveLine,
  onSubmit,
}: {
  products: ProductOption[];
  lines: LineDraft[];
  saleBusy: boolean;
  saleMsg: string | null;
  onAddLine: () => void;
  onSetLine: (i: number, patch: Partial<LineDraft>) => void;
  onRemoveLine: (i: number) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)]/60 p-4 shadow-lg shadow-black/20 backdrop-blur-sm sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-[var(--muted)]">Catat penjualan</p>
        <span className="rounded-xl bg-white/10 p-2 text-[var(--foreground)]">
          <Receipt className="h-5 w-5" />
        </span>
      </div>
      <form onSubmit={onSubmit} className="mt-3 space-y-2">
        <QtyLineRows
          products={products}
          lines={lines}
          onSetLine={onSetLine}
          onRemoveLine={onRemoveLine}
          selectClassName="min-w-[120px] flex-1 rounded-xl border border-[var(--card-border)] bg-[#0f0e0c] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={onAddLine}
            className="inline-flex items-center gap-1 rounded-xl bg-white/5 px-3 py-2 text-xs font-medium ring-1 ring-[var(--card-border)] hover:bg-white/10"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah baris
          </button>
          <button
            type="submit"
            disabled={saleBusy}
            className="inline-flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-dim)] px-4 py-2 text-sm font-semibold text-[#1a1206] shadow-md disabled:opacity-60"
          >
            {saleBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Simpan penjualan
          </button>
        </div>
        {saleMsg && <p className="text-xs text-[var(--muted)]">{saleMsg}</p>}
      </form>
    </div>
  );
}
