import { NextResponse } from "next/server";
import pool from "@/lib/mysql";
import type { ProductDoc } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

function badId() {
  return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const productId = Number(id);
    if (isNaN(productId) || productId <= 0) return badId();

    const body = await req.json();
    const updates: string[] = [];
    const values: any[] = [];

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) return NextResponse.json({ error: "Nama tidak boleh kosong" }, { status: 400 });
      updates.push("name = ?");
      values.push(name);
    }
    if (body.unit !== undefined) {
      updates.push("unit = ?");
      values.push(String(body.unit).trim() || "pcs");
    }
    if (body.stock !== undefined) {
      updates.push("stock = ?");
      values.push(Math.max(0, Math.floor(Number(body.stock))));
    }
    if (body.minStock !== undefined) {
      updates.push("min_stock = ?");
      values.push(Math.max(0, Math.floor(Number(body.minStock))));
    }
    if (body.sellPrice !== undefined) {
      updates.push("sell_price = ?");
      values.push(Math.max(0, Number(body.sellPrice)));
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "Tidak ada field yang diupdate" }, { status: 400 });
    }

    updates.push("updated_at = ?");
    values.push(new Date());
    values.push(productId);

    const query = `UPDATE products SET ${updates.join(", ")} WHERE id = ?`;
    const [result] = await pool.query(query, values);
    const updateResult = result as any;

    if (updateResult.affectedRows === 0) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal memperbarui produk" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const productId = Number(id);
    if (isNaN(productId) || productId <= 0) return badId();

    const [result] = await pool.query("DELETE FROM products WHERE id = ?", [productId]);
    const deleteResult = result as any;

    if (deleteResult.affectedRows === 0) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal menghapus produk" }, { status: 500 });
  }
}
