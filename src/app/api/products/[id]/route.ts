import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { getDbName } from "@/lib/mongodb";
import type { ProductDoc } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

function badId() {
  return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    if (!ObjectId.isValid(id)) return badId();

    const body = await req.json();
    const updates: Partial<ProductDoc> = { updatedAt: new Date() };

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) return NextResponse.json({ error: "Nama tidak boleh kosong" }, { status: 400 });
      updates.name = name;
    }
    if (body.unit !== undefined) updates.unit = String(body.unit).trim() || "pcs";
    if (body.stock !== undefined) updates.stock = Math.max(0, Math.floor(Number(body.stock)));
    if (body.minStock !== undefined) updates.minStock = Math.max(0, Math.floor(Number(body.minStock)));
    if (body.sellPrice !== undefined) updates.sellPrice = Math.max(0, Number(body.sellPrice));

    const client = await clientPromise;
    const db = client.db(getDbName());
    const res = await db.collection<ProductDoc>("products").updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    if (res.matchedCount === 0) {
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
    if (!ObjectId.isValid(id)) return badId();

    const client = await clientPromise;
    const db = client.db(getDbName());
    const res = await db.collection<ProductDoc>("products").deleteOne({ _id: new ObjectId(id) });

    if (res.deletedCount === 0) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal menghapus produk" }, { status: 500 });
  }
}
