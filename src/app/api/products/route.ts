import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, readJsonBody } from "@/lib/api-error";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' }
    });
    
    const body = products.map((p) => ({
      id: p.id.toString(),
      name: p.name,
      unit: p.unit,
      stock: p.stock,
      minStock: p.minStock,
      sellPrice: Math.round(Number(p.sellPrice)),
      is_service: p.is_service || false,
      createdAt: p.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: p.updatedAt?.toISOString() || new Date().toISOString(),
    }));

    return NextResponse.json(body);
  } catch (e) {
    return errorResponse("GET /api/products", e, "Gagal mengambil produk");
  }
}

export async function POST(req: Request) {
  try {
    const body = await readJsonBody(req);
    const name = String(body.name ?? "").trim();
    const unit = String(body.unit ?? "pcs").trim() || "pcs";
    const stock = Number(body.stock ?? 0);
    const minStock = Number(body.minStock ?? 5);
    const sellPrice = Number(body.sellPrice ?? 0);
    const is_service = Boolean(body.is_service ?? false);

    if (!name) {
      return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });
    }

    if (![stock, minStock, sellPrice].every(Number.isFinite)) {
      return NextResponse.json(
        { error: "Stok, minimal stok, dan harga jual harus berupa angka" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        unit,
        stock: Math.max(0, Math.floor(stock)),
        minStock: Math.max(0, Math.floor(minStock)),
        purchasePrice: 0,
        sellPrice: Math.max(0, sellPrice),
        is_service
      }
    });

    return NextResponse.json({ id: product.id.toString() }, { status: 201 });
  } catch (e) {
    return errorResponse("POST /api/products", e, "Gagal menambah produk");
  }
}
