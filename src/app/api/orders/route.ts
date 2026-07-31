import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { badRequest, errorResponse, readJsonBody } from "@/lib/api-error";
import { parseLineItems } from "@/lib/line-items";

const paymentStatuses = ["pending", "paid", "failed", "expired"] as const;
type PaymentStatus = (typeof paymentStatuses)[number];

function isPaymentStatus(value: string): value is PaymentStatus {
  return (paymentStatuses as readonly string[]).includes(value);
}

type NewOrderItem = Omit<Prisma.OrderItemCreateManyInput, "orderId">;

export async function POST(req: Request) {
  try {
    const body = await readJsonBody(req);
    const customerName = body.customerName != null ? String(body.customerName).trim() : null;
    const customerPhone = body.customerPhone != null ? String(body.customerPhone).trim() : null;
    const lines = parseLineItems(body.items, "Item pesanan wajib diisi");

    // Calculate total and validate items
    let totalAmount = 0;
    const orderItems: NewOrderItem[] = [];

    for (const line of lines) {
      const product = await prisma.product.findUnique({
        where: { id: line.productId }
      });

      if (!product) {
        throw badRequest(`Produk dengan ID ${line.productId} tidak ditemukan`);
      }

      if (product.stock < line.qty) {
        throw badRequest(`Stok ${product.name} tidak cukup`);
      }

      const unitPrice = Number(product.sellPrice);
      const subtotal = unitPrice * line.qty;
      totalAmount += subtotal;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        qty: line.qty,
        unitPrice,
        subtotal,
      });
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Order dan itemnya harus tersimpan bersama; kalau item gagal, order ikut dibatalkan.
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          customerName,
          customerPhone,
          totalAmount,
          paymentStatus: 'pending'
        }
      });

      await tx.orderItem.createMany({
        data: orderItems.map((item) => ({ orderId: created.id, ...item })),
      });

      return created;
    });

    return NextResponse.json({
      orderId: order.id.toString(),
      orderNumber,
      totalAmount,
    });
  } catch (e) {
    return errorResponse("POST /api/orders", e, "Gagal membuat pesanan");
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: Prisma.OrderWhereInput = {};
    if (status) {
      if (!isPaymentStatus(status)) {
        throw badRequest("Status pembayaran tidak valid");
      }
      where.paymentStatus = status;
    }

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
    return errorResponse("GET /api/orders", e, "Gagal mengambil pesanan");
  }
}
