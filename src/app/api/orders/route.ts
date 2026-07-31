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

export async function POST(req: Request) {
  try {
    const body = await readJsonBody(req);
    const customerName = body.customerName != null ? String(body.customerName).trim() : null;
    const customerPhone = body.customerPhone != null ? String(body.customerPhone).trim() : null;
    const lines = parseLineItems(body.items, "Item pesanan wajib diisi");

    const method = body.paymentMethod === "cash" ? "cash" : "qris";

    const dbProducts = await prisma.product.findMany({
      where: { id: { in: lines.map((line) => line.productId) } }
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

    for (const line of lines) {
      const product = productMap.get(line.productId);
      if (!product) {
        throw badRequest(`Produk dengan ID ${line.productId} tidak ditemukan`);
      }

      if (!product.is_service && product.stock < line.qty) {
        throw badRequest(`Stok ${product.name} tidak cukup (tersisa ${product.stock})`);
      }

      const unitPrice = Number(product.sellPrice);
      const subtotal = unitPrice * line.qty;
      totalAmount += subtotal;

      validatedItems.push({
        product,
        qty: line.qty,
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
      await tx.orderItem.createMany({
        data: validatedItems.map((line) => ({
          orderId: order.id,
          productId: line.product.id,
          productName: line.product.name,
          qty: line.qty,
          unitPrice: line.unitPrice,
          subtotal: line.subtotal
        }))
      });

      // 3. If paid immediately (cash), create Sale and decrement stock
      if (isPaid) {
        const sale = await tx.sale.create({
          data: {
            occurredAt: now,
            total: totalAmount
          }
        });

        await tx.saleItem.createMany({
          data: validatedItems.map((line) => ({
            saleId: sale.id,
            productId: line.product.id,
            name: line.product.name,
            qty: line.qty,
            unitPrice: line.unitPrice,
            subtotal: line.subtotal
          }))
        });

        for (const line of validatedItems) {
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
