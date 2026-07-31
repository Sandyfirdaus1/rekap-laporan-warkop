import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseQtyLines, resolveStockLines } from "@/lib/stock-lines";
import { badRequest, serverError } from "@/lib/api-response";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const occurredAt = body.occurredAt ? new Date(body.occurredAt) : new Date();
    const reason = body.reason != null ? String(body.reason).trim() : undefined;
    const note = body.note != null ? String(body.note).trim() : undefined;

    if (Number.isNaN(occurredAt.getTime())) {
      return badRequest("Tanggal tidak valid");
    }

    const lines = parseQtyLines(body.items);
    if (lines.length === 0) {
      return badRequest("Minimal satu barang dan jumlah keluar");
    }

    const resolved = await resolveStockLines(lines);
    if ("error" in resolved) return badRequest(resolved.error);

    const outItems = resolved.lines;
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const stockOut = await tx.stockOut.create({
        data: {
          occurredAt,
          reason,
          note
        }
      });

      for (const item of outItems) {
        await tx.stockOutItem.create({
          data: {
            stockOutId: stockOut.id,
            productId: item.productId,
            name: item.name,
            qty: item.qty
          }
        });
      }

      for (const line of outItems) {
        await tx.product.update({
          where: { id: line.productId },
          data: {
            stock: { decrement: line.qty },
            updatedAt: now
          }
        });
      }

      const totalQty = outItems.reduce((s, x) => s + x.qty, 0);
      return { totalQty };
    });

    return NextResponse.json({ ok: true, totalQty: result.totalQty }, { status: 201 });
  } catch (e) {
    return serverError(e, "Gagal mencatat barang keluar");
  }
}
