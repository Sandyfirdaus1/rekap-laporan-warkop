"use client";

import { inputClass, qtyInputClass } from "@/lib/ui";

export type ProductOption = {
  id: string;
  name: string;
  unit: string;
  stock: number;
};

export type LineDraft = { productId: string; qty: string };

/** Daftar baris "pilih barang + jumlah" yang dipakai form penjualan dan barang keluar. */
export function QtyLineRows({
  products,
  lines,
  onSetLine,
  onRemoveLine,
  selectClassName = inputClass,
}: {
  products: ProductOption[];
  lines: LineDraft[];
  onSetLine: (i: number, patch: Partial<LineDraft>) => void;
  onRemoveLine: (i: number) => void;
  selectClassName?: string;
}) {
  return (
    <>
      {lines.map((line, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <select
            value={line.productId}
            onChange={(e) => onSetLine(i, { productId: e.target.value })}
            className={selectClassName}
          >
            <option value="">Pilih barang</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (stok {p.stock} {p.unit})
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={line.qty}
            onChange={(e) => onSetLine(i, { qty: e.target.value })}
            className={qtyInputClass}
          />
          {lines.length > 1 && (
            <button
              type="button"
              onClick={() => onRemoveLine(i)}
              className="rounded-xl px-2 text-xs text-red-300 hover:bg-red-500/10"
            >
              Hapus
            </button>
          )}
        </div>
      ))}
    </>
  );
}
