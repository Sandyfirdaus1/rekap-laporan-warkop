import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildChartLabels, formatChartKey, resolveRangeParams } from "@/lib/date-range";
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

    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' }
    });

    const sales = await prisma.sale.findMany({
      where: {
        occurredAt: {
          gte: start,
          lte: end
        }
      },
      orderBy: { occurredAt: 'asc' },
      include: {
        items: true
      }
    });

    const stockOuts = await prisma.stockOut.findMany({
      where: {
        occurredAt: {
          gte: start,
          lte: end
        }
      },
      orderBy: { occurredAt: 'asc' },
      include: {
        items: true
      }
    });

    const totalProducts = products.length;
    const available = products.filter((p) => p.stock > p.minStock);
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= p.minStock);
    const outOfStock = products.filter((p) => p.stock === 0);

    const totalRevenue = sales.reduce((s, x) => s + Number(x.total), 0);
    const transactionCount = sales.length;

    const totalQtySold = sales.reduce((s, sale) => s + sumQty(sale.items), 0);
    const totalQtyStockOut = stockOuts.reduce((s, doc) => s + sumQty(doc.items), 0);
    const stockOutTransactionCount = stockOuts.length;

    const labels = buildChartLabels(range, start, end);
    const chartMap = new Map<string, Bucket>();
    for (const label of labels) {
      chartMap.set(label, emptyBucket());
    }

    for (const sale of sales) {
      const key = formatChartKey(range, new Date(sale.occurredAt));
      const cur = chartMap.get(key) ?? emptyBucket();
      cur.revenue += Number(sale.total);
      cur.transactions += 1;
      cur.qtySold += sumQty(sale.items);
      chartMap.set(key, cur);
    }

    for (const doc of stockOuts) {
      const key = formatChartKey(range, new Date(doc.occurredAt));
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
