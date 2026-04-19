import { NextResponse } from "next/server";
import { ObjectId, type ClientSession } from "mongodb";
import clientPromise, { getDbName } from "@/lib/mongodb";
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

    const client = await clientPromise;
    const db = client.db(getDbName());
    const sales = await db
      .collection<SaleDoc>("sales")
      .find({ occurredAt: { $gte: start, $lte: end } })
      .sort({ occurredAt: 1 })
      .toArray();

    const totalRevenue = sales.reduce((s, x) => s + x.total, 0);

    const chartMap = new Map<string, { revenue: number; transactions: number }>();

    for (const sale of sales) {
      const d = sale.occurredAt;
      const key = range === "today" ? formatHourKey(d) : formatDayKey(d);
      const cur = chartMap.get(key) ?? { revenue: 0, transactions: 0 };
      cur.revenue += sale.total;
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
        id: s._id.toString(),
        occurredAt: s.occurredAt.toISOString(),
        total: s.total,
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
  const client = await clientPromise;
  const db = client.db(getDbName());
  let session: ClientSession | undefined;

  try {
    const body = await req.json();
    const rawItems = Array.isArray(body.items) ? body.items : [];
    const occurredAt = body.occurredAt ? new Date(body.occurredAt) : new Date();
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
      return NextResponse.json({ error: "Minimal satu item penjualan" }, { status: 400 });
    }

    const productsCol = db.collection<ProductDoc>("products");
    const saleItems: SaleItem[] = [];
    let total = 0;

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
    session = client.startSession();

    await session.withTransaction(async () => {
      await db.collection("sales").insertOne(
        {
          occurredAt,
          items: saleItems,
          total,
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

    return NextResponse.json({ ok: true, total }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal menyimpan penjualan" }, { status: 500 });
  } finally {
    if (session) await session.endSession();
  }
}
