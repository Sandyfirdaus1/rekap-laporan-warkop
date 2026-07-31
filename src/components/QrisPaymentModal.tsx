"use client";

import { idr } from "@/lib/format";

export function QrisPaymentModal({
  orderNumber,
  totalAmount,
  onConfirm,
  onClose,
}: {
  orderNumber: string;
  totalAmount: number;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--card-border)] p-6 max-w-md w-full space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Pembayaran QRIS</h3>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground)]">
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <div className="text-center">
            <p className="text-sm text-[var(--muted)]">Nomor Pesanan</p>
            <p className="font-mono font-medium text-[var(--foreground)]">{orderNumber}</p>
          </div>

          <div className="text-center">
            <p className="text-sm text-[var(--muted)]">Total Pembayaran</p>
            <p className="text-2xl font-bold text-[var(--accent)]">{idr(totalAmount)}</p>
          </div>

          <div className="bg-white rounded-xl p-4 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/qris/qris.jpeg"
              alt="QRIS"
              className="max-w-[200px] h-auto"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.nextElementSibling?.classList.remove("hidden");
              }}
            />
            <p className="hidden text-center text-sm text-red-500">
              Gambar QRIS belum tersedia.<br />
              Silakan upload gambar QRIS ke folder:<br />
              <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">public/images/qris/qris.jpeg</code>
            </p>
          </div>

          <p className="text-xs text-center text-[var(--muted)]">Scan QRIS di atas untuk membayar</p>
        </div>

        <div className="border-t border-[var(--card-border)] pt-4">
          <p className="text-sm font-medium text-[var(--foreground)] mb-3">Konfirmasi Pembayaran</p>
          <div className="flex gap-2">
            <button
              onClick={onConfirm}
              className="flex-1 rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 transition-colors"
            >
              Sudah Bayar
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-xl bg-[var(--card-border)] px-4 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--card-border)]/80 transition-colors"
            >
              Belum
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
