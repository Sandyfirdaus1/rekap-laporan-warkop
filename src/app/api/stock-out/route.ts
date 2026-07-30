import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ProductDoc, StockOutItem } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawItems = Array.isArray(body.items) ? body.items : [];
    const occurredAt = body.occurredAt ? new Date(body.occurredAt) : new Date();
    const reason = body.reason != null ? String(body.reason).trim() : undefined;
    const note = body.note != null ? String(body.note).trim() : undefined;

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
      return NextResponse.json({ error: "Minimal satu barang dan jumlah keluar" }, { status: 400 });
    }

    const outItems: StockOutItem[] = [];

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
    console.error(e);
    return NextResponse.json({ error: "Gagal mencatat barang keluar" }, { status: 500 });
  }
}
