import { NextResponse } from "next/server";
import pool from "@/lib/mysql";
import {
  formatDayKey,
  formatHourKey,
  getRangeBounds,
  type RangePreset,
} from "@/lib/date-range";
import type { ProductDoc, SaleDoc, SaleItem } from "@/lib/types";

const validPresets: RangePreset[] = ["today", "week", "month"];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const range = (searchParams.get("range") ?? "today") as RangePreset;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let start: Date;
    let end: Date;

    if (startDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (endDate) {
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      } else {
        // If only start date, get sales for that specific day only
        end = new Date(startDate);
        end.setHours(23, 59, 59, 999);
      }
    } else {
      if (!validPresets.includes(range)) {
        return NextResponse.json({ error: "range tidak valid" }, { status: 400 });
      }
      const bounds = getRangeBounds(range);
      start = bounds.start;
      end = bounds.end;
    }

    const [salesRows] = await pool.query(
      "SELECT id, occurred_at as occurredAt, total, created_at as createdAt FROM sales WHERE occurred_at >= ? AND occurred_at <= ? ORDER BY occurred_at ASC",
      [start, end]
    );

    const sales = salesRows as any[];
    
    // Get sale items for each sale
    for (const sale of sales) {
      const [itemsRows] = await pool.query(
        "SELECT product_id as productId, name, qty, unit_price as unitPrice, subtotal FROM sale_items WHERE sale_id = ?",
        [sale.id]
      );
      sale.items = itemsRows as any[];
    }

    const totalRevenue = sales.reduce((s, x) => s + Number(x.total), 0);

    const chartMap = new Map<string, { revenue: number; transactions: number }>();

    for (const sale of sales) {
      const d = new Date(sale.occurredAt);
      const key = range === "today" ? formatHourKey(d) : formatDayKey(d);
      const cur = chartMap.get(key) ?? { revenue: 0, transactions: 0 };
      cur.revenue += Number(sale.total);
      cur.transactions += 1;
      chartMap.set(key, cur);
    }

    const labels = Array.from(chartMap.keys()).sort();
    const chart = labels.map((label) => ({
      label,
      revenue: chartMap.get(label)!.revenue,
      transactions: chartMap.get(label)!.transactions,
    }));

    return NextResponse.json({
      range,
      start: start.toISOString(),
      end: end.toISOString(),
      totalRevenue,
      transactionCount: sales.length,
      sales: sales.map((s) => ({
        id: s.id.toString(),
        occurredAt: s.occurredAt.toISOString(),
        total: Number(s.total),
        items: s.items,
      })),
      chart,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal mengambil penjualan" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const body = await req.json();
    const rawItems = Array.isArray(body.items) ? body.items : [];
    const occurredAt = body.occurredAt ? new Date(body.occurredAt) : new Date();
    if (Number.isNaN(occurredAt.getTime())) {
      return NextResponse.json({ error: "Tanggal tidak valid" }, { status: 400 });
    }

    type Line = { productId: number; qty: number };
    const lines: Line[] = [];
    for (const row of rawItems) {
      const pid = Number(row.productId ?? 0);
      const qty = Math.floor(Number(row.qty ?? 0));
      if (pid > 0 && qty > 0) {
        lines.push({ productId: pid, qty });
      }
    }

    if (lines.length === 0) {
      return NextResponse.json({ error: "Minimal satu item penjualan" }, { status: 400 });
    }

    const saleItems: SaleItem[] = [];
    let total = 0;

    for (const line of lines) {
      const [products] = await connection.query(
        "SELECT id, name, stock, sell_price as sellPrice FROM products WHERE id = ? FOR UPDATE",
        [line.productId]
      );
      const productRows = products as any[];
      
      if (productRows.length === 0) {
        await connection.rollback();
        return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 400 });
      }
      
      const p = productRows[0];
      if (p.stock < line.qty) {
        await connection.rollback();
        return NextResponse.json(
          { error: `Stok "${p.name}" tidak mencukupi (tersisa ${p.stock})` },
          { status: 400 }
        );
      }
      
      const subtotal = line.qty * p.sellPrice;
      total += subtotal;
      saleItems.push({
        productId: line.productId.toString(),
        name: p.name,
        qty: line.qty,
        unitPrice: p.sellPrice,
        subtotal,
      });
    }

    const now = new Date();
    
    // Insert sale
    const [saleResult] = await connection.query(
      "INSERT INTO sales (occurred_at, total) VALUES (?, ?)",
      [occurredAt, total]
    );
    const saleInsertResult = saleResult as any;
    const saleId = saleInsertResult.insertId;

    // Insert sale items
    for (const item of saleItems) {
      await connection.query(
        "INSERT INTO sale_items (sale_id, product_id, name, qty, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)",
        [saleId, item.productId, item.name, item.qty, item.unitPrice, item.subtotal]
      );
    }

    // Update product stocks
    for (const line of lines) {
      await connection.query(
        "UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ?",
        [line.qty, now, line.productId]
      );
    }

    await connection.commit();
    return NextResponse.json({ ok: true, total }, { status: 201 });
  } catch (e) {
    await connection.rollback();
    console.error(e);
    return NextResponse.json({ error: "Gagal menyimpan penjualan" }, { status: 500 });
  } finally {
    connection.release();
  }
}
