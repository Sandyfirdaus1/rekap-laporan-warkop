import { NextResponse } from "next/server";
import pool from "@/lib/mysql";
import type { ProductDoc } from "@/lib/types";

export async function GET() {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, unit, stock, min_stock as minStock, sell_price as sellPrice, created_at as createdAt, updated_at as updatedAt FROM products ORDER BY name ASC"
    );
    
    const products = rows as any[];
    
    const body = products.map((p) => ({
      id: p.id.toString(),
      name: p.name,
      unit: p.unit,
      stock: p.stock,
      minStock: p.minStock,
      sellPrice: Math.round(Number(p.sellPrice)),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

    return NextResponse.json(body);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal mengambil produk" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const unit = String(body.unit ?? "pcs").trim() || "pcs";
    const stock = Number(body.stock ?? 0);
    const minStock = Number(body.minStock ?? 5);
    const sellPrice = Number(body.sellPrice ?? 0);

    if (!name) {
      return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });
    }

    const [result] = await pool.query(
      "INSERT INTO products (name, unit, stock, min_stock, purchase_price, sell_price) VALUES (?, ?, ?, ?, ?, ?)",
      [name, unit, Math.max(0, Math.floor(stock)), Math.max(0, Math.floor(minStock)), 0, Math.max(0, sellPrice)]
    );

    const insertResult = result as any;
    return NextResponse.json({ id: insertResult.insertId.toString() }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal menambah produk" }, { status: 500 });
  }
}
