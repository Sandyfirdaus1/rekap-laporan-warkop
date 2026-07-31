import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, customerName, customerPhone, paymentMethod } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Item pesanan wajib diisi" }, { status: 400 });
    }

    const method = paymentMethod === "cash" ? "cash" : "qris";

    const productIds = items.map((it: any) => Number(it.productId)).filter(Boolean);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });
    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    type ValidatedLine = {
      product: (typeof dbProducts)[number];
      qty: number;
      unitPrice: number;
      subtotal: number;
    };

    let totalAmount = 0;
    const validatedItems: ValidatedLine[] = [];

    for (const item of items) {
      const productId = Number(item.productId);
      const qty = Number(item.qty);

      if (qty <= 0) {
        return NextResponse.json({ error: "Jumlah item harus lebih dari 0" }, { status: 400 });
      }

      const product = productMap.get(productId);
      if (!product) {
        return NextResponse.json({ error: `Produk dengan ID ${productId} tidak ditemukan` }, { status: 400 });
      }

      if (!product.is_service && product.stock < qty) {
        return NextResponse.json({ error: `Stok ${product.name} tidak cukup (tersisa ${product.stock})` }, { status: 400 });
      }

      const unitPrice = Number(product.sellPrice);
      const subtotal = unitPrice * qty;
      totalAmount += subtotal;

      validatedItems.push({
        product,
        qty,
        unitPrice,
        subtotal
      });
    }

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const isPaid = method === "cash";
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerName,
          customerPhone,
          totalAmount,
          paymentMethod: method,
          paymentStatus: isPaid ? "paid" : "pending",
        }
      });

      // 2. Create Order Items
      for (const line of validatedItems) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: line.product.id,
            productName: line.product.name,
            qty: line.qty,
            unitPrice: line.unitPrice,
            subtotal: line.subtotal
          }
        });
      }

      // 3. If paid immediately (cash), create Sale and decrement stock
      if (isPaid) {
        const sale = await tx.sale.create({
          data: {
            occurredAt: now,
            total: totalAmount
          }
        });

        for (const line of validatedItems) {
          await tx.saleItem.create({
            data: {
              saleId: sale.id,
              productId: line.product.id,
              name: line.product.name,
              qty: line.qty,
              unitPrice: line.unitPrice,
              subtotal: line.subtotal
            }
          });

          if (!line.product.is_service) {
            await tx.product.update({
              where: { id: line.product.id },
              data: {
                stock: { decrement: line.qty },
                updatedAt: now
              }
            });
          }
        }
      }

      return order;
    });

    return NextResponse.json({
      orderId: result.id.toString(),
      orderNumber,
      totalAmount,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal membuat pesanan" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where = status ? { paymentStatus: status as any } : {};

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: true
      }
    });
    
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      totalAmount: Number(order.totalAmount),
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt?.toISOString(),
      updatedAt: order.updatedAt?.toISOString(),
      items: order.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        qty: item.qty,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal)
      }))
    }));

    return NextResponse.json(formattedOrders);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal mengambil pesanan" }, { status: 500 });
  }
}
