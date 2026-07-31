import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { badRequest, errorResponse, readJsonBody } from "@/lib/api-error";

type Ctx = { params: Promise<{ id: string }> };

function parseProductId(id: string) {
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId <= 0) {
    throw badRequest("ID tidak valid");
  }
  return productId;
}

function parseCount(value: unknown, field: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw badRequest(`${field} harus berupa angka`);
  }
  return Math.max(0, Math.floor(n));
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const productId = parseProductId(id);

    const body = await readJsonBody(req);
    const updateData: Prisma.ProductUpdateInput = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) throw badRequest("Nama tidak boleh kosong");
      updateData.name = name;
    }
    if (body.unit !== undefined) {
      updateData.unit = String(body.unit).trim() || "pcs";
    }
    if (body.stock !== undefined) {
      updateData.stock = parseCount(body.stock, "Stok");
    }
    if (body.minStock !== undefined) {
      updateData.minStock = parseCount(body.minStock, "Minimal stok");
    }
    if (body.sellPrice !== undefined) {
      const sellPrice = Number(body.sellPrice);
      if (!Number.isFinite(sellPrice)) throw badRequest("Harga jual harus berupa angka");
      updateData.sellPrice = Math.max(0, sellPrice);
    }
    if (body.is_service !== undefined) {
      updateData.is_service = Boolean(body.is_service);
    }

    if (Object.keys(updateData).length === 0) {
      throw badRequest("Tidak ada field yang diupdate");
    }

    updateData.updatedAt = new Date();

    await prisma.product.update({
      where: { id: productId },
      data: updateData
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse("PATCH /api/products/[id]", e, "Gagal memperbarui produk", {
      notFoundMessage: "Produk tidak ditemukan",
    });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const productId = parseProductId(id);

    await prisma.product.delete({
      where: { id: productId }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse("DELETE /api/products/[id]", e, "Gagal menghapus produk", {
      notFoundMessage: "Produk tidak ditemukan",
    });
  }
}
