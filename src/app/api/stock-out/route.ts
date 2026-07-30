import { NextResponse } from "next/server";
import pool from "@/lib/mysql";
import type { ProductDoc, StockOutItem } from "@/lib/types";

export async function POST(req: Request) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const body = await req.json();
    const rawItems = Array.isArray(body.items) ? body.items : [];
    const occurredAt = body.occurredAt ? new Date(body.occurredAt) : new Date();
    const reason = body.reason != null ? String(body.reason).trim() : undefined;
    const note = body.note != null ? String(body.note).trim() : undefined;

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
      return NextResponse.json({ error: "Minimal satu barang dan jumlah keluar" }, { status: 400 });
    }

    const outItems: StockOutItem[] = [];

    for (const line of lines) {
      const [products] = await connection.query(
        "SELECT id, name, stock FROM products WHERE id = ? FOR UPDATE",
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
      
      outItems.push({
        productId: line.productId.toString(),
        name: p.name,
        qty: line.qty,
      });
    }

    const now = new Date();
    
    // Insert stock out
    const [stockOutResult] = await connection.query(
      "INSERT INTO stock_outs (occurred_at, reason, note) VALUES (?, ?, ?)",
      [occurredAt, reason || null, note || null]
    );
    const stockOutInsertResult = stockOutResult as any;
    const stockOutId = stockOutInsertResult.insertId;

    // Insert stock out items
    for (const item of outItems) {
      await connection.query(
        "INSERT INTO stock_out_items (stock_out_id, product_id, name, qty) VALUES (?, ?, ?, ?)",
        [stockOutId, item.productId, item.name, item.qty]
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
    const totalQty = outItems.reduce((s, x) => s + x.qty, 0);
    return NextResponse.json({ ok: true, totalQty }, { status: 201 });
  } catch (e) {
    await connection.rollback();
    console.error(e);
    return NextResponse.json({ error: "Gagal mencatat barang keluar" }, { status: 500 });
  } finally {
    connection.release();
  }
}
