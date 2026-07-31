import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildChartLabels, formatChartKey, resolveChartMode, resolveRangeParams } from "@/lib/date-range";
import { fetchSalesWithPaidOrders } from "@/lib/sales-source";
import { toProductSummary } from "@/lib/serialize";
import { badRequest, serverError } from "@/lib/api-response";

type Bucket = {
  revenue: number;
  transactions: number;
  qtySold: number;
  qtyStockOut: number;
};

function emptyBucket(): Bucket {
  return { revenue: 0, transactions: 0, qtySold: 0, qtyStockOut: 0 };
}

function sumQty(items: { qty: number }[]) {
  return items.reduce((a, it) => a + it.qty, 0);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const resolved = resolveRangeParams(searchParams);
    if ("error" in resolved) return badRequest(resolved.error);
    const { range, start, end } = resolved;
    const hasStartDate = Boolean(searchParams.get("startDate"));

    const [products, allSales, stockOuts] = await Promise.all([
      prisma.product.findMany({ orderBy: { name: 'asc' } }),
      fetchSalesWithPaidOrders(start, end),
      prisma.stockOut.findMany({
        where: { occurredAt: { gte: start, lte: end } },
        orderBy: { occurredAt: 'asc' },
        include: { items: true }
      })
    ]);

    const totalProducts = products.length;
    const available = products.filter((p) => p.stock > p.minStock);
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= p.minStock);
    const outOfStock = products.filter((p) => p.stock === 0);

    const totalRevenue = allSales.reduce((s, x) => s + x.total, 0);
    const transactionCount = allSales.length;
    const totalQtySold = allSales.reduce((s, sale) => s + sumQty(sale.items), 0);
    const totalQtyStockOut = stockOuts.reduce((s, doc) => s + sumQty(doc.items), 0);
    const stockOutTransactionCount = stockOuts.length;

    const mode = resolveChartMode(range, hasStartDate);
    const labels = buildChartLabels(mode, start, end, { fullDay: hasStartDate });
    const chartMap = new Map<string, Bucket>();
    for (const label of labels) {
      chartMap.set(label, emptyBucket());
    }

    for (const sale of allSales) {
      const key = formatChartKey(mode, new Date(sale.occurredAt));
      const cur = chartMap.get(key) ?? emptyBucket();
      cur.revenue += sale.total;
      cur.transactions += 1;
      cur.qtySold += sumQty(sale.items);
      chartMap.set(key, cur);
    }

    for (const doc of stockOuts) {
      const key = formatChartKey(mode, new Date(doc.occurredAt));
      const cur = chartMap.get(key) ?? emptyBucket();
      cur.qtyStockOut += sumQty(doc.items);
      chartMap.set(key, cur);
    }

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
        available: available.map(toProductSummary),
        lowStock: lowStock.map(toProductSummary),
        outOfStock: outOfStock.map(toProductSummary),
      },
      chart,
    });
  } catch (e) {
    return serverError(e, "Gagal memuat dashboard");
  }
}
