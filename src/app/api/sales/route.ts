import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatDayKey, formatHourKey, resolveRangeParams } from "@/lib/date-range";
import { parseQtyLines, resolveStockLines } from "@/lib/stock-lines";
import { badRequest, serverError } from "@/lib/api-response";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const resolved = resolveRangeParams(searchParams);
    if ("error" in resolved) return badRequest(resolved.error);
    const { range, start, end } = resolved;

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
    return serverError(e, "Gagal mengambil penjualan");
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const occurredAt = body.occurredAt ? new Date(body.occurredAt) : new Date();
    if (Number.isNaN(occurredAt.getTime())) {
      return badRequest("Tanggal tidak valid");
    }

    const lines = parseQtyLines(body.items, true);
    if (lines.length === 0) {
      return badRequest("Minimal satu item penjualan");
    }

    const resolved = await resolveStockLines(lines);
    if ("error" in resolved) return badRequest(resolved.error);

    const saleItems = resolved.lines;
    const total = saleItems.reduce((s, item) => s + item.subtotal, 0);
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          occurredAt,
          total
        }
      });

      for (const item of saleItems) {
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            name: item.name,
            qty: item.qty,
            unitPrice: item.sellPrice,
            subtotal: item.subtotal
          }
        });
      }

      for (const line of saleItems) {
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
    return serverError(e, "Gagal menyimpan penjualan");
  }
}
