import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  formatDayKey,
  formatHourKey,
  formatMonthKey,
  getRangeBounds,
  type RangePreset,
} from "@/lib/date-range";
import type { ProductDoc, SaleDoc, StockOutDoc } from "@/lib/types";

const validPresets: RangePreset[] = ["today", "week", "month", "year"];

type Bucket = {
  revenue: number;
  transactions: number;
  qtySold: number;
  qtyStockOut: number;
};

function emptyBucket(): Bucket {
  return { revenue: 0, transactions: 0, qtySold: 0, qtyStockOut: 0 };
}

function mapProduct(p: any) {
  return {
    id: p.id.toString(),
    name: p.name,
    unit: p.unit,
    stock: p.stock,
    minStock: p.minStock,
    purchasePrice: p.purchasePrice ? Number(p.purchasePrice) : undefined,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const range = (searchParams.get("range") ?? "today") as RangePreset;
    const startDate = searchParams.get("startDate");

    let start: Date;
    let end: Date;

    if (startDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(startDate);
      end.setHours(23, 59, 59, 999);
    } else {
      if (!validPresets.includes(range)) {
        return NextResponse.json({ error: "range tidak valid" }, { status: 400 });
      }
      const bounds = getRangeBounds(range);
      start = bounds.start;
      end = bounds.end;
    }

    const [products, sales, paidOrders, stockOuts] = await Promise.all([
      prisma.product.findMany({
        orderBy: { name: 'asc' }
      }),
      prisma.sale.findMany({
        where: {
          occurredAt: { gte: start, lte: end }
        },
        orderBy: { occurredAt: 'asc' },
        include: { items: true }
      }),
      prisma.order.findMany({
        where: {
          paymentStatus: 'paid',
          updatedAt: { gte: start, lte: end }
        },
        orderBy: { updatedAt: 'asc' },
        include: { items: true }
      }),
      prisma.stockOut.findMany({
        where: {
          occurredAt: { gte: start, lte: end }
        },
        orderBy: { occurredAt: 'asc' },
        include: { items: true }
      })
    ]);

    const totalProducts = products.length;
    const available = products.filter((p) => p.stock > p.minStock);
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= p.minStock);
    const outOfStock = products.filter((p) => p.stock === 0);

    type NormalizedSaleItem = {
      productId: string;
      name: string;
      qty: number;
      unitPrice: number;
      subtotal: number;
    };

    type NormalizedSale = {
      id: string;
      occurredAt: Date;
      total: number;
      items: NormalizedSaleItem[];
    };

    const allSales: NormalizedSale[] = [
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
    ];

    const totalRevenue = allSales.reduce((s, x) => s + x.total, 0);
    const transactionCount = allSales.length;

    const totalQtySold = allSales.reduce(
      (s, sale) => s + sale.items.reduce((a, it) => a + it.qty, 0),
      0
    );
    const totalQtyStockOut = stockOuts.reduce(
      (s, doc) => s + doc.items.reduce((a: number, it: any) => a + it.qty, 0),
      0
    );
    const stockOutTransactionCount = stockOuts.length;

    // Calculate Top Products
    const productSalesMap = new Map<string, { id: string, name: string; qty: number }>();
    for (const sale of allSales) {
      for (const item of sale.items) {
        const existing = productSalesMap.get(item.productId) || {
          id: item.productId,
          name: item.name,
          qty: 0,
        };
        existing.qty += item.qty;
        productSalesMap.set(item.productId, existing);
      }
    }
    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    // Calculate Payment Methods (from Orders mostly, Sales fallback to Cash)
    const paymentMethodsMap = new Map<string, { method: string; count: number; total: number }>();
    for (const sale of sales) {
      const method = "Cash";
      const current = paymentMethodsMap.get(method) || { method, count: 0, total: 0 };
      current.count += 1;
      current.total += Number(sale.total);
      paymentMethodsMap.set(method, current);
    }
    for (const order of paidOrders) {
      const method = order.paymentMethod || "Other";
      const current = paymentMethodsMap.get(method) || { method, count: 0, total: 0 };
      current.count += 1;
      current.total += Number(order.totalAmount);
      paymentMethodsMap.set(method, current);
    }
    const paymentMethods = Array.from(paymentMethodsMap.values()).sort((a, b) => b.count - a.count);

    const getWibDate = (date: Date) => {
      return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    };

    const chartMap = new Map<string, Bucket>();

    if (startDate || range === "today") {
      const startWib = getWibDate(start);
      const dayKey = formatDayKey(startWib);
      const maxHour = 23;
      for (let h = 0; h <= maxHour; h++) {
        const label = `${dayKey} ${String(h).padStart(2, "0")}:00`;
        chartMap.set(label, emptyBucket());
      }
    } else if (range === "year") {
      for (let m = 0; m < 12; m++) {
        const startWib = getWibDate(start);
        const label = `${startWib.getFullYear()}-${String(m + 1).padStart(2, "0")}`;
        chartMap.set(label, emptyBucket());
      }
    } else {
      // range === "week" or "month"
      const cur = getWibDate(start);
      const endWib = getWibDate(end);
      while (cur <= endWib) {
        chartMap.set(formatDayKey(cur), emptyBucket());
        cur.setDate(cur.getDate() + 1);
      }
    }

    for (const sale of allSales) {
      const d = getWibDate(new Date(sale.occurredAt));
      const key = startDate || range === "today" ? formatHourKey(d) : range === "year" ? formatMonthKey(d) : formatDayKey(d);
      const cur = chartMap.get(key) ?? emptyBucket();
      cur.revenue += sale.total;
      cur.transactions += 1;
      cur.qtySold += sale.items.reduce((a, it) => a + it.qty, 0);
      chartMap.set(key, cur);
    }

    for (const doc of stockOuts) {
      const d = getWibDate(new Date(doc.occurredAt));
      const key = startDate || range === "today" ? formatHourKey(d) : range === "year" ? formatMonthKey(d) : formatDayKey(d);
      const cur = chartMap.get(key) ?? emptyBucket();
      cur.qtyStockOut += doc.items.reduce((a: number, it: any) => a + it.qty, 0);
      chartMap.set(key, cur);
    }

    const labels = Array.from(chartMap.keys());

    const chart = labels.map((label) => {
      const v = chartMap.get(label) ?? emptyBucket();
      return {
        label,
        revenue: v.revenue,
        transactions: v.transactions,
        qtySold: v.qtySold,
        qtyStockOut: v.qtyStockOut,
        totalQtyOut: v.qtySold + v.qtyStockOut,
      };
    });

    return NextResponse.json({
      range,
      start: start.toISOString(),
      end: end.toISOString(),
      stats: {
        totalProducts,
        availableProducts: available.length,
        totalRevenue,
        transactionCount,
        totalQtySold,
        totalQtyStockOut,
        stockOutTransactionCount,
        totalQtyOut: totalQtySold + totalQtyStockOut,
      },
      stockByStatus: {
        available: available.map(mapProduct),
        lowStock: lowStock.map(mapProduct),
        outOfStock: outOfStock.map(mapProduct),
      },
      chart,
      topProducts,
      paymentMethods,
      recentSales: allSales.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal memuat dashboard" }, { status: 500 });
  }
}
