import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { badRequest, notFound, serverError } from "@/lib/api-response";

type Ctx = { params: Promise<{ id: string }> };

async function parseProductId(ctx: Ctx) {
  const { id } = await ctx.params;
  const productId = Number(id);
  return isNaN(productId) || productId <= 0 ? null : productId;
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const productId = await parseProductId(ctx);
    if (!productId) return badRequest("ID tidak valid");

    const body = await req.json();
    const updateData: Prisma.ProductUpdateInput = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) return badRequest("Nama tidak boleh kosong");
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
    if (body.is_service !== undefined) {
      updateData.is_service = Boolean(body.is_service);
    }

    if (Object.keys(updateData).length === 0) {
      return badRequest("Tidak ada field yang diupdate");
    }

    updateData.updatedAt = new Date();

    const product = await prisma.product.update({
      where: { id: productId },
      data: updateData
    });

    if (!product) {
      return notFound("Produk tidak ditemukan");
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError(e, "Gagal memperbarui produk");
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const productId = await parseProductId(ctx);
    if (!productId) return badRequest("ID tidak valid");

    const product = await prisma.product.delete({
      where: { id: productId }
    });

    if (!product) {
      return notFound("Produk tidak ditemukan");
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError(e, "Gagal menghapus produk");
  }
}
