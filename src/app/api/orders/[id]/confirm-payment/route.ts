import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = Number(id);

    if (!orderId || isNaN(orderId)) {
      return NextResponse.json({ error: "ID pesanan tidak valid" }, { status: 400 });
    }

    // Use Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if order exists and get current status
      const order = await tx.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        throw new Error("Pesanan tidak ditemukan");
      }

      if (order.paymentStatus === 'paid') {
        throw new Error("Pesanan sudah dikonfirmasi pembayarannya");
      }

      // Get order items to update stock and create sale
      const items = await tx.orderItem.findMany({
        where: { orderId }
      });

      // Update stock for each item
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.qty },
            updatedAt: new Date()
          }
        });
      }

      // Create sale record for dashboard integration
      const sale = await tx.sale.create({
        data: {
          occurredAt: order.createdAt || new Date(),
          total: order.totalAmount
        }
      });

      // Create sale items
      for (const item of items) {
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            name: item.productName,
            qty: item.qty,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal
          }
        });
      }

      // Update payment status to 'paid'
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'paid',
          paymentMethod: 'QRIS',
          updatedAt: new Date()
        }
      });

      return {
        success: true,
        orderId: updatedOrder.id,
        customerName: updatedOrder.customerName
      };
    });

    return NextResponse.json({
      success: true,
      message: "Pembayaran berhasil dikonfirmasi",
      orderId: result.orderId,
      customerName: result.customerName
    });
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : "Gagal mengkonfirmasi pembayaran";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}