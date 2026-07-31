import type { Product } from "@prisma/client";
import type { ProductJSON } from "@/lib/types";

/** Ringkasan produk untuk panel stok (tanpa harga jual). */
export function toProductSummary(p: Product) {
  return {
    id: p.id.toString(),
    name: p.name,
    unit: p.unit,
    stock: p.stock,
    minStock: p.minStock,
    purchasePrice: p.purchasePrice ? Number(p.purchasePrice) : undefined,
  };
}

export function toProductJSON(p: Product): ProductJSON {
  const fallback = new Date().toISOString();
  return {
    id: p.id.toString(),
    name: p.name,
    unit: p.unit,
    stock: p.stock,
    minStock: p.minStock,
    sellPrice: Math.round(Number(p.sellPrice)),
    is_service: p.is_service || false,
    createdAt: p.createdAt?.toISOString() ?? fallback,
    updatedAt: p.updatedAt?.toISOString() ?? fallback,
  };
}
