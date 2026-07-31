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

    // Check if order exists with items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    if (order.paymentStatus === 'paid') {
      return NextResponse.json({ error: "Pesanan sudah dikonfirmasi pembayarannya" }, { status: 400 });
    }

    const now = new Date();

    // Update payment status to 'paid', create Sale, and decrement stock
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const orderRes = await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'paid',
          paymentMethod: order.paymentMethod ?? 'qris',
          updatedAt: now
        }
      });

      // Create Sale record
      const sale = await tx.sale.create({
        data: {
          occurredAt: now,
          total: order.totalAmount
        }
      });

      // Insert sale items & update product stocks
      for (const item of order.items) {
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

        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });
        if (product && !product.is_service) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: item.qty },
              updatedAt: now
            }
          });
        }
      }

      return orderRes;
    });

    return NextResponse.json({
      success: true,
      message: "Pembayaran berhasil dikonfirmasi",
      orderId: updatedOrder.id.toString(),
      customerName: updatedOrder.customerName
    });
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : "Gagal mengkonfirmasi pembayaran";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}