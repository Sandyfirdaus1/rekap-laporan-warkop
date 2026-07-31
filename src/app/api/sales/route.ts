import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  formatDayKey,
  formatHourKey,
  getRangeBounds,
  type RangePreset,
} from "@/lib/date-range";
import type { ProductDoc, SaleDoc, SaleItem } from "@/lib/types";
import { requireAuth } from "@/lib/auth";

const validPresets: RangePreset[] = ["today", "week", "month"];

export async function GET(req: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

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
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

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
      const product = await prisma.product.findUnique({
        where: { id: line.productId }
      });
      
      if (!product) {
        return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 400 });
      }
      
      if (product.stock < line.qty) {
        return NextResponse.json(
          { error: `Stok "${product.name}" tidak mencukupi (tersisa ${product.stock})` },
          { status: 400 }
        );
      }
      
      const subtotal = line.qty * Number(product.sellPrice);
      total += subtotal;
      saleItems.push({
        productId: line.productId.toString(),
        name: product.name,
        qty: line.qty,
        unitPrice: Number(product.sellPrice),
        subtotal,
      });
    }

    const now = new Date();
    
    // Use Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      // Insert sale
      const sale = await tx.sale.create({
        data: {
          occurredAt,
          total
        }
      });

      // Insert sale items
      for (const item of saleItems) {
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: Number(item.productId),
            name: item.name,
            qty: item.qty,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal
          }
        });
      }

      // Update product stocks
      for (const line of lines) {
        await tx.product.update({
          where: { id: line.productId },
          data: {
            stock: { decrement: line.qty },
            updatedAt: now
          }
        });
      }

      return { saleId: sale.id, total };
    });

    return NextResponse.json({ ok: true, total: result.total }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal menyimpan penjualan" }, { status: 500 });
  }
}
