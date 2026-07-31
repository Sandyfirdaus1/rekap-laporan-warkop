import { NextResponse } from "next/server";
import { $Enums } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseQtyLines, resolveStockLines } from "@/lib/stock-lines";
import { badRequest, serverError } from "@/lib/api-response";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, customerName, customerPhone } = body;

    const parsedLines = parseQtyLines(items);
    if (parsedLines.length === 0) {
      return badRequest("Item pesanan wajib diisi");
    }

    const resolved = await resolveStockLines(parsedLines);
    if ("error" in resolved) return badRequest(resolved.error);

    const lines = resolved.lines;
    const totalAmount = lines.reduce((sum, line) => sum + line.subtotal, 0);

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerName,
        customerPhone,
        totalAmount,
        paymentStatus: 'pending'
      }
    });

    for (const line of lines) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: line.productId,
          productName: line.name,
          qty: line.qty,
          unitPrice: line.sellPrice,
          subtotal: line.subtotal
        }
      });
    }

    return NextResponse.json({
      orderId: order.id.toString(),
      orderNumber,
      totalAmount,
    });
  } catch (e) {
    return serverError(e, "Gagal membuat pesanan");
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as $Enums.orders_payment_status | null;

    const orders = await prisma.order.findMany({
      where: status ? { paymentStatus: status } : {},
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
    return serverError(e, "Gagal mengambil pesanan");
  }
}
