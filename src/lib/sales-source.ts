import { prisma } from "@/lib/prisma";

export type NormalizedSaleItem = {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
};

export type NormalizedSale = {
  id: string;
  occurredAt: Date;
  total: number;
  items: NormalizedSaleItem[];
};

/**
 * Gabungan transaksi pada rentang waktu: penjualan langsung ditambah pesanan
 * yang sudah dibayar, diurutkan dari yang terbaru.
 */
export async function fetchSalesWithPaidOrders(start: Date, end: Date): Promise<NormalizedSale[]> {
  const [sales, paidOrders] = await Promise.all([
    prisma.sale.findMany({
      where: { occurredAt: { gte: start, lte: end } },
      include: { items: true },
    }),
    prisma.order.findMany({
      where: { paymentStatus: "paid", updatedAt: { gte: start, lte: end } },
      include: { items: true },
    }),
  ]);

  return [
    ...sales.map((s) => ({
      id: `sale-${s.id}`,
      occurredAt: s.occurredAt,
      total: Number(s.total),
      items: s.items.map((it) => ({
        productId: it.productId.toString(),
        name: it.name,
        qty: it.qty,
        unitPrice: Number(it.unitPrice),
        subtotal: Number(it.subtotal),
      })),
    })),
    ...paidOrders.map((o) => ({
      id: `ord-${o.id}`,
      occurredAt: o.updatedAt ?? o.createdAt ?? new Date(),
      total: Number(o.totalAmount),
      items: o.items.map((it) => ({
        productId: it.productId.toString(),
        name: it.productName,
        qty: it.qty,
        unitPrice: Number(it.unitPrice),
        subtotal: Number(it.subtotal),
      })),
    })),
  ].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
}
