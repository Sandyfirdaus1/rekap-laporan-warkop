import { NextResponse } from "next/server";
import { ObjectId, type ClientSession } from "mongodb";
import clientPromise, { getDbName } from "@/lib/mongodb";
import type { ProductDoc, StockOutItem } from "@/lib/types";

export async function POST(req: Request) {
  const client = await clientPromise;
  const db = client.db(getDbName());
  let session: ClientSession | undefined;

  try {
    const body = await req.json();
    const rawItems = Array.isArray(body.items) ? body.items : [];
    const occurredAt = body.occurredAt ? new Date(body.occurredAt) : new Date();
    const reason = body.reason != null ? String(body.reason).trim() : undefined;
    const note = body.note != null ? String(body.note).trim() : undefined;

    if (Number.isNaN(occurredAt.getTime())) {
      return NextResponse.json({ error: "Tanggal tidak valid" }, { status: 400 });
    }

    type Line = { productId: ObjectId; qty: number };
    const lines: Line[] = [];
    for (const row of rawItems) {
      const pid = String(row.productId ?? "");
      const qty = Math.floor(Number(row.qty ?? 0));
      if (!ObjectId.isValid(pid) || qty <= 0) continue;
      lines.push({ productId: new ObjectId(pid), qty });
    }

    if (lines.length === 0) {
      return NextResponse.json({ error: "Minimal satu barang dan jumlah keluar" }, { status: 400 });
    }

    const productsCol = db.collection<ProductDoc>("products");
    const outItems: StockOutItem[] = [];

    for (const line of lines) {
      const p = await productsCol.findOne({ _id: line.productId });
      if (!p) {
        return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 400 });
      }
      if (p.stock < line.qty) {
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
    session = client.startSession();

    await session.withTransaction(async () => {
      await db.collection("stock_outs").insertOne(
        {
          occurredAt,
          items: outItems,
          reason: reason || undefined,
          note: note || undefined,
          createdAt: now,
        },
        { session }
      );

      for (const line of lines) {
        await productsCol.updateOne(
          { _id: line.productId },
          { $inc: { stock: -line.qty }, $set: { updatedAt: now } },
          { session }
        );
      }
    });

    const totalQty = outItems.reduce((s, x) => s + x.qty, 0);
    return NextResponse.json({ ok: true, totalQty }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal mencatat barang keluar" }, { status: 500 });
  } finally {
    if (session) await session.endSession();
  }
}
