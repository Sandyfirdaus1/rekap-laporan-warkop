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
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : "Gagal mengkonfirmasi pembayaran";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}