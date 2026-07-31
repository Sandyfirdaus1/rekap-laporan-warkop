import { prisma } from "@/lib/prisma";

export type QtyLine = { productId: number; qty: number };

export type ResolvedLine = QtyLine & {
  name: string;
  sellPrice: number;
  subtotal: number;
};

/** Ambil pasangan productId/qty yang valid (keduanya > 0) dari body request. */
export function parseQtyLines(rawItems: unknown): QtyLine[] {
  const rows = Array.isArray(rawItems) ? rawItems : [];
  const lines: QtyLine[] = [];

  for (const row of rows) {
    const item = row as { productId?: unknown; qty?: unknown };
    const productId = Number(item.productId ?? 0);
    const qty = Math.floor(Number(item.qty ?? 0));
    if (productId > 0 && qty > 0) {
      lines.push({ productId, qty });
    }
  }

  return lines;
}

/**
 * Muat produk tiap baris dan validasi ketersediaan stok.
 * Mengembalikan `error` (pesan siap tampil) bila produk tidak ada atau stok kurang.
 */
export async function resolveStockLines(
  lines: QtyLine[]
): Promise<{ lines: ResolvedLine[] } | { error: string }> {
  const resolved: ResolvedLine[] = [];

  for (const line of lines) {
    const product = await prisma.product.findUnique({ where: { id: line.productId } });

    if (!product) {
      return { error: `Produk dengan ID ${line.productId} tidak ditemukan` };
    }

    if (product.stock < line.qty) {
      return { error: `Stok "${product.name}" tidak mencukupi (tersisa ${product.stock})` };
    }

    const sellPrice = Number(product.sellPrice);
    resolved.push({
      productId: line.productId,
      qty: line.qty,
      name: product.name,
      sellPrice,
      subtotal: sellPrice * line.qty,
    });
  }

  return { lines: resolved };
}
