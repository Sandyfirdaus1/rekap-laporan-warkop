import { prisma } from "@/lib/prisma";

export type QtyLine = { productId: number; qty: number; unitPrice?: number };

export type ResolvedLine = {
  productId: number;
  qty: number;
  name: string;
  sellPrice: number;
  subtotal: number;
  isService: boolean;
};

/**
 * Ambil pasangan productId/qty yang valid (keduanya > 0) dari body request.
 * `allowUnitPrice` mengizinkan harga manual per baris (dipakai form penjualan).
 */
export function parseQtyLines(rawItems: unknown, allowUnitPrice = false): QtyLine[] {
  const rows = Array.isArray(rawItems) ? rawItems : [];
  const lines: QtyLine[] = [];

  for (const row of rows) {
    const item = row as { productId?: unknown; qty?: unknown; unitPrice?: unknown };
    const productId = Number(item.productId ?? 0);
    const qty = Math.floor(Number(item.qty ?? 0));
    if (productId <= 0 || qty <= 0) continue;

    const unitPrice =
      allowUnitPrice && item.unitPrice !== undefined ? Number(item.unitPrice) : undefined;
    lines.push({ productId, qty, unitPrice });
  }

  return lines;
}

/**
 * Muat produk tiap baris dan validasi ketersediaan stok (produk jasa dilewati).
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

    if (!product.is_service && product.stock < line.qty) {
      return { error: `Stok "${product.name}" tidak mencukupi (tersisa ${product.stock})` };
    }

    const sellPrice = line.unitPrice ?? Number(product.sellPrice);
    resolved.push({
      productId: line.productId,
      qty: line.qty,
      name: product.name,
      sellPrice,
      subtotal: sellPrice * line.qty,
      isService: Boolean(product.is_service),
    });
  }

  return { lines: resolved };
}
