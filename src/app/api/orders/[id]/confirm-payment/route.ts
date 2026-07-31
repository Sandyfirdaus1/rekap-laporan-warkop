import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, notFound, serverError } from "@/lib/api-response";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = Number(id);

    if (!orderId || isNaN(orderId)) {
      return badRequest("ID pesanan tidak valid");
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return notFound("Pesanan tidak ditemukan");
    }

    if (order.paymentStatus === 'paid') {
      return badRequest("Pesanan sudah dikonfirmasi pembayarannya");
    }

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
    return serverError(e, "Gagal mengkonfirmasi pembayaran", { useErrorMessage: true });
  }
}
