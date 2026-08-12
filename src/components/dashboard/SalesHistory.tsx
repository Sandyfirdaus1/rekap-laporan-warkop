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
  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Riwayat penjualan</h2>
        <span className="rounded-lg bg-[var(--accent-light)] p-2 text-[var(--accent)]">
          <Receipt className="h-4 w-4" />
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] px-3 py-2">
          <Calendar className="h-4 w-4 text-[var(--muted)]" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-transparent text-sm focus:outline-none"
          />
        </div>
        {selectedDate && (
          <button onClick={() => onDateChange("")} className="btn-ghost flex items-center gap-1 py-2 text-sm">
            <X className="h-4 w-4" />
            Reset
          </button>
        )}
        <span className="ml-auto text-xs text-[var(--muted)]">{sales.length} transaksi</span>
      </div>

      <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
        {sales.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--muted)]">Tidak ada transaksi</p>
        ) : (
          sales.map((sale) => (
            <div
              key={sale.id}
              className="rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] p-3"
            >
              <div className="mb-2 flex items-center justify-between">
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
              {sale.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span>
                    {item.name} × {item.qty}
                  </span>
                  <span className="text-[var(--muted)]">{idr(item.subtotal)}</span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
