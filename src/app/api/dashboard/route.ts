import { NextResponse } from "next/server";
import pool from "@/lib/mysql";
import {
  formatDayKey,
  formatHourKey,
  getRangeBounds,
  type RangePreset,
} from "@/lib/date-range";
import type { ProductDoc, SaleDoc, StockOutDoc } from "@/lib/types";

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

function mapProduct(p: ProductDoc) {
  return {
    id: p.id.toString(),
    name: p.name,
    unit: p.unit,
    stock: p.stock,
    minStock: p.minStock,
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

    const [productsRows] = await pool.query(
      "SELECT id, name, unit, stock, min_stock as minStock FROM products ORDER BY name ASC"
    );
    const products = productsRows as any[];

    const [salesRows] = await pool.query(
      "SELECT id, occurred_at as occurredAt, total FROM sales WHERE occurred_at >= ? AND occurred_at <= ? ORDER BY occurred_at ASC",
      [start, end]
    );
    const sales = salesRows as any[];

    const [stockOutsRows] = await pool.query(
      "SELECT id, occurred_at as occurredAt FROM stock_outs WHERE occurred_at >= ? AND occurred_at <= ? ORDER BY occurred_at ASC",
      [start, end]
    );
    const stockOuts = stockOutsRows as any[];

    // Get sale items for each sale
    for (const sale of sales) {
      const [itemsRows] = await pool.query(
        "SELECT qty FROM sale_items WHERE sale_id = ?",
        [sale.id]
      );
      sale.items = itemsRows as any[];
    }

    // Get stock out items for each stock out
    for (const stockOut of stockOuts) {
      const [itemsRows] = await pool.query(
        "SELECT qty FROM stock_out_items WHERE stock_out_id = ?",
        [stockOut.id]
      );
      stockOut.items = itemsRows as any[];
    }

    const totalProducts = products.length;
    const available = products.filter((p) => p.stock > p.minStock);
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= p.minStock);
    const outOfStock = products.filter((p) => p.stock === 0);

    const totalRevenue = sales.reduce((s, x) => s + Number(x.total), 0);
    const transactionCount = sales.length;

    const totalQtySold = sales.reduce(
      (s, sale) => s + sale.items.reduce((a: number, it: any) => a + it.qty, 0),
      0
    );
    const totalQtyStockOut = stockOuts.reduce(
      (s, doc) => s + doc.items.reduce((a: number, it: any) => a + it.qty, 0),
      0
    );
    const stockOutTransactionCount = stockOuts.length;

    const chartMap = new Map<string, Bucket>();

    if (range === "today") {
      const dayKey = formatDayKey(start);
      for (let h = 0; h < 24; h++) {
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
      cur.qtySold += sale.items.reduce((a: number, it: any) => a + it.qty, 0);
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
      cur.qtyStockOut += doc.items.reduce((a: number, it: any) => a + it.qty, 0);
      chartMap.set(key, cur);
    }

    let labels: string[];
    if (range === "today") {
      const dayKey = formatDayKey(start);
      labels = Array.from({ length: 24 }, (_, h) => `${dayKey} ${String(h).padStart(2, "0")}:00`);
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
    console.error(e);
    return NextResponse.json({ error: "Gagal memuat dashboard" }, { status: 500 });
  }
}
