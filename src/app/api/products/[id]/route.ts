import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
    const updateData: any = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) return NextResponse.json({ error: "Nama tidak boleh kosong" }, { status: 400 });
      updateData.name = name;
    }
    if (body.unit !== undefined) {
      updateData.unit = String(body.unit).trim() || "pcs";
    }
    if (body.stock !== undefined) {
      updateData.stock = Math.max(0, Math.floor(Number(body.stock)));
    }
    if (body.minStock !== undefined) {
      updateData.minStock = Math.max(0, Math.floor(Number(body.minStock)));
    }
    if (body.sellPrice !== undefined) {
      updateData.sellPrice = Math.max(0, Number(body.sellPrice));
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Tidak ada field yang diupdate" }, { status: 400 });
    }

    updateData.updatedAt = new Date();

    const product = await prisma.product.update({
      where: { id: productId },
      data: updateData
    });

    if (!product) {
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

    const product = await prisma.product.delete({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal menghapus produk" }, { status: 500 });
  }
}
