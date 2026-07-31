import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { StockOutItem } from "@/lib/types";
import { badRequest, errorResponse, readJsonBody } from "@/lib/api-error";
import { parseLineItems, parseOccurredAt } from "@/lib/line-items";

export async function POST(req: Request) {
  try {
    const body = await readJsonBody(req);
    const occurredAt = parseOccurredAt(body.occurredAt);
    const reason = body.reason != null ? String(body.reason).trim() : undefined;
    const note = body.note != null ? String(body.note).trim() : undefined;
    const lines = parseLineItems(body.items, "Minimal satu barang dan jumlah keluar");

    const outItems: StockOutItem[] = [];

    for (const line of lines) {
      const product = await prisma.product.findUnique({
        where: { id: line.productId }
      });
      
      if (!product) {
        throw badRequest(`Produk dengan ID ${line.productId} tidak ditemukan`);
      }

      if (product.stock < line.qty) {
        throw badRequest(`Stok "${product.name}" tidak mencukupi (tersisa ${product.stock})`);
      }
      
      outItems.push({
        productId: line.productId.toString(),
        name: product.name,
        qty: line.qty,
      });
    }

    const now = new Date();
    
    // Use Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      // Insert stock out
      const stockOut = await tx.stockOut.create({
        data: {
          occurredAt,
          reason,
          note
        }
      });

      // Insert stock out items
      for (const item of outItems) {
        await tx.stockOutItem.create({
          data: {
            stockOutId: stockOut.id,
            productId: Number(item.productId),
            name: item.name,
            qty: item.qty
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

      const totalQty = outItems.reduce((s, x) => s + x.qty, 0);
      return { totalQty };
    });

    return NextResponse.json({ ok: true, totalQty: result.totalQty }, { status: 201 });
  } catch (e) {
    return errorResponse("POST /api/stock-out", e, "Gagal mencatat barang keluar");
  }
}
