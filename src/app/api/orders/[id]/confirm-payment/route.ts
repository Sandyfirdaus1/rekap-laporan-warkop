import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, errorResponse } from "@/lib/api-error";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = Number(id);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      throw badRequest("ID pesanan tidak valid");
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    if (order.paymentStatus === 'paid') {
      return NextResponse.json({ error: "Pesanan sudah dikonfirmasi pembayarannya" }, { status: 400 });
    }

    // Update payment status to 'paid'
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'paid',
        paymentMethod: order.paymentMethod ?? 'qris',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: "Pembayaran berhasil dikonfirmasi",
      orderId: updatedOrder.id.toString(),
      customerName: updatedOrder.customerName
    });
  } catch (e) {
    return errorResponse(
      "POST /api/orders/[id]/confirm-payment",
      e,
      "Gagal mengkonfirmasi pembayaran",
      { notFoundMessage: "Pesanan tidak ditemukan" }
    );
  }
}