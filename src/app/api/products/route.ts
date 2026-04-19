import { NextResponse } from "next/server";
import clientPromise, { getDbName } from "@/lib/mongodb";
import type { ProductDoc } from "@/lib/types";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(getDbName());
    const products = await db
      .collection<ProductDoc>("products")
      .find({})
      .sort({ name: 1 })
      .toArray();

    const body = products.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      unit: p.unit,
      stock: p.stock,
      minStock: p.minStock,
      sellPrice: p.sellPrice,
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

    const now = new Date();
    const client = await clientPromise;
    const db = client.db(getDbName());
    const result = await db.collection("products").insertOne({
      name,
      unit,
      stock: Math.max(0, Math.floor(stock)),
      minStock: Math.max(0, Math.floor(minStock)),
      purchasePrice: 0,
      sellPrice: Math.max(0, sellPrice),
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ id: result.insertedId.toString() }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal menambah produk" }, { status: 500 });
  }
}
