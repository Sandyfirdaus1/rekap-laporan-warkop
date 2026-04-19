"use client";

import { Receipt, Calendar, X } from "lucide-react";
import { idr } from "@/lib/format";

type SaleItem = {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
};

type Sale = {
  id: string;
  occurredAt: string;
  total: number;
  items: SaleItem[];
};

export function SalesHistory({
  sales,
  selectedDate,
  onDateChange,
}: {
  sales: Sale[];
  selectedDate: string;
  onDateChange: (date: string) => void;
}) {
  const clearFilter = () => {
    onDateChange("");
  };

  if (sales.length === 0 && !selectedDate) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)]/60 p-4 shadow-lg shadow-black/20 backdrop-blur-sm sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-[var(--muted)]">Riwayat penjualan</p>
        <span className="rounded-xl bg-white/10 p-2 text-[var(--foreground)]">
          <Receipt className="h-5 w-5" />
        </span>
      </div>

      {/* Date Filter */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-[var(--card-border)] bg-white/5 px-3 py-2">
          <Calendar className="h-4 w-4 text-[var(--muted)]" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-transparent text-sm text-[var(--foreground)] focus:outline-none"
          />
        </div>
        {selectedDate && (
          <button
            onClick={clearFilter}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--card-border)] bg-white/5 px-3 py-2 text-sm text-[var(--muted)] hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
            Reset
          </button>
        )}
        <span className="ml-auto text-xs text-[var(--muted)]">
          {sales.length} transaksi
        </span>
      </div>

      <div className="mt-4 max-h-80 overflow-y-auto space-y-3">
        {sales.length === 0 ? (
          <div className="text-center py-8 text-sm text-[var(--muted)]">
            {selectedDate ? "Tidak ada transaksi pada tanggal ini" : "Tidak ada transaksi"}
          </div>
        ) : (
          sales.map((sale) => (
            <div
              key={sale.id}
              className="rounded-xl border border-[var(--card-border)] bg-white/5 p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[var(--muted)]">
                  {new Date(sale.occurredAt).toLocaleString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="text-sm font-semibold text-[var(--accent)]">{idr(sale.total)}</span>
              </div>
              <div className="space-y-1">
                {sale.items.map((item: SaleItem, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-[var(--foreground)]">
                      {item.name} × {item.qty}
                    </span>
                    <span className="text-[var(--muted)]">{idr(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
