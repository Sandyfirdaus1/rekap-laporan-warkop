import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toProductJSON } from "@/lib/serialize";
import { badRequest, serverError } from "@/lib/api-response";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(products.map(toProductJSON));
  } catch (e) {
    return serverError(e, "Gagal mengambil produk");
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const unit = String(body.unit ?? "pcs").trim() || "pcs";
    const stock = Number(body.stock ?? 0);
    const minStock = Number(body.minStock ?? 5);
    const sellPrice = Number(body.sellPrice ?? 0);

    if (!name) {
      return badRequest("Nama wajib diisi");
    }

    const product = await prisma.product.create({
      data: {
        name,
        unit,
        stock: Math.max(0, Math.floor(stock)),
        minStock: Math.max(0, Math.floor(minStock)),
        purchasePrice: 0,
        sellPrice: Math.max(0, sellPrice)
      }
    });

    return NextResponse.json({ id: product.id.toString() }, { status: 201 });
  } catch (e) {
    return serverError(e, "Gagal menambah produk");
  }
}
