"use client";

import { inputClass } from "@/lib/ui";

export type ProductDraft = {
  name: string;
  unit: string;
  stock: string;
  minStock: string;
  sellPrice: string;
};

/** Field nama/satuan/stok/min/harga yang dipakai form tambah dan form edit barang. */
export function ProductFields({
  draft,
  onChange,
  namePlaceholder,
  stockLabel = "Stok",
  minStockLabel = "Min",
  priceFullWidth = false,
}: {
  draft: ProductDraft;
  onChange: (patch: Partial<ProductDraft>) => void;
  namePlaceholder?: string;
  stockLabel?: string;
  minStockLabel?: string;
  priceFullWidth?: boolean;
}) {
  return (
    <>
      <div className="sm:col-span-2">
        <label className="text-xs text-[var(--muted)]">Nama</label>
        <input
          className={inputClass}
          value={draft.name}
          onChange={(e) => onChange({ name: e.target.value })}
          required
          placeholder={namePlaceholder}
        />
      </div>
      <div>
        <label className="text-xs text-[var(--muted)]">Satuan</label>
        <input
          className={inputClass}
          value={draft.unit}
          onChange={(e) => onChange({ unit: e.target.value })}
        />
      </div>
      <div>
        <label className="text-xs text-[var(--muted)]">{stockLabel}</label>
        <input
          type="number"
          min={0}
          className={inputClass}
          value={draft.stock}
          onChange={(e) => onChange({ stock: e.target.value })}
        />
      </div>
      <div>
        <label className="text-xs text-[var(--muted)]">{minStockLabel}</label>
        <input
          type="number"
          min={0}
          className={inputClass}
          value={draft.minStock}
          onChange={(e) => onChange({ minStock: e.target.value })}
        />
      </div>
      <div className={priceFullWidth ? "sm:col-span-2" : undefined}>
        <label className="text-xs text-[var(--muted)]">Harga</label>
        <input
          type="number"
          min={0}
          className={inputClass}
          value={draft.sellPrice}
          onChange={(e) => onChange({ sellPrice: e.target.value })}
        />
      </div>
    </>
  );
}
