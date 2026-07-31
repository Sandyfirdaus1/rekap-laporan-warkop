import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  formatDayKey,
  formatHourKey,
  getRangeBounds,
  type RangePreset,
} from "@/lib/date-range";
import { badRequest, errorResponse } from "@/lib/api-error";

const validPresets: RangePreset[] = ["today", "week", "month"];

type Bucket = {
  revenue: number;
  transactions: number;
  qtySold: number;
  qtyStockOut: number;
};

function emptyBucket(): Bucket {
  return { revenue: 0, transactions: 0, qtySold: 0, qtyStockOut: 0 };
}

type ProductRow = Awaited<ReturnType<typeof prisma.product.findMany>>[number];

function mapProduct(p: ProductRow) {
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
      if (Number.isNaN(start.getTime())) {
        throw badRequest("startDate tidak valid");
      }
      start.setHours(0, 0, 0, 0);
      end = new Date(startDate);
      end.setHours(23, 59, 59, 999);
    } else {
      if (!validPresets.includes(range)) {
        throw badRequest("range tidak valid");
      }
      const bounds = getRangeBounds(range);
      start = bounds.start;
      end = bounds.end;
    }

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

    const totalQtySold = sales.reduce(
      (s, sale) => s + sale.items.reduce((a, it) => a + it.qty, 0),
      0
    );
    const totalQtyStockOut = stockOuts.reduce(
      (s, doc) => s + doc.items.reduce((a, it) => a + it.qty, 0),
      0
    );
    const stockOutTransactionCount = stockOuts.length;

    const chartMap = new Map<string, Bucket>();

    if (range === "today") {
      const dayKey = formatDayKey(start);
      const currentHour = new Date().getHours();
      for (let h = 0; h <= currentHour; h++) {
        const label = `${dayKey} ${String(h).padStart(2, "0")}:00`;
        chartMap.set(label, emptyBucket());
      }
    } else if (range === "month") {
      // Initialize all 12 months for the current year
      const year = start.getFullYear();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      for (let m = 0; m < 12; m++) {
        chartMap.set(`${year}-${String(m + 1).padStart(2, "0")}`, emptyBucket());
      }
    }

    for (const sale of sales) {
      const d = new Date(sale.occurredAt);
      let key: string;
      if (range === "today") {
        key = formatHourKey(d);
      } else if (range === "month") {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      } else {
        key = formatDayKey(d);
      }
      const cur = chartMap.get(key) ?? emptyBucket();
      cur.revenue += Number(sale.total);
      cur.transactions += 1;
      cur.qtySold += sale.items.reduce((a, it) => a + it.qty, 0);
      chartMap.set(key, cur);
    }

    for (const doc of stockOuts) {
      const d = new Date(doc.occurredAt);
      let key: string;
      if (range === "today") {
        key = formatHourKey(d);
      } else if (range === "month") {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      } else {
        key = formatDayKey(d);
      }
      const cur = chartMap.get(key) ?? emptyBucket();
      cur.qtyStockOut += doc.items.reduce((a, it) => a + it.qty, 0);
      chartMap.set(key, cur);
    }

    let labels: string[];
    if (range === "today") {
      const dayKey = formatDayKey(start);
      const currentHour = new Date().getHours();
      labels = Array.from({ length: currentHour + 1 }, (_, h) => `${dayKey} ${String(h).padStart(2, "0")}:00`);
    } else if (range === "month") {
      const year = start.getFullYear();
      labels = [];
      for (let m = 0; m < 12; m++) {
        labels.push(`${year}-${String(m + 1).padStart(2, "0")}`);
      }
    } else {
      labels = [];
      const cur = new Date(start);
      while (cur <= end) {
        labels.push(formatDayKey(cur));
        cur.setDate(cur.getDate() + 1);
      }
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
        available: available.map(mapProduct),
        lowStock: lowStock.map(mapProduct),
        outOfStock: outOfStock.map(mapProduct),
      },
      chart,
    });
  } catch (e) {
    return errorResponse("GET /api/dashboard", e, "Gagal memuat dashboard");
  }
}
