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

    // Calculate total and validate items
    let totalAmount = 0;
    const itemDetails = [];

    for (const item of items) {
      const productId = Number(item.productId);
      const qty = Number(item.qty);
      
      if (qty <= 0) {
        return NextResponse.json({ error: "Jumlah item harus lebih dari 0" }, { status: 400 });
      }

      // Get product info
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });
      
      if (!product) {
        return NextResponse.json({ error: `Produk dengan ID ${productId} tidak ditemukan` }, { status: 400 });
      }
      
      if (product.stock < qty) {
        return NextResponse.json({ error: `Stok ${product.name} tidak cukup` }, { status: 400 });
      }

      const subtotal = Number(product.sellPrice) * qty;
      totalAmount += subtotal;

      itemDetails.push({
        id: product.id.toString(),
        price: Number(product.sellPrice),
        quantity: qty,
        name: product.name,
      });
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create order in database
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerName,
        customerPhone,
        totalAmount,
        paymentMethod: method,
        paymentStatus: method === "cash" ? "paid" : "pending",
      }
    });

    // Insert order items
    for (const item of items) {
      const productId = Number(item.productId);
      const qty = Number(item.qty);
      
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });
      
      if (product) {
        const subtotal = Number(product.sellPrice) * qty;

        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId,
            productName: product.name,
            qty,
            unitPrice: Number(product.sellPrice),
            subtotal
          }
        });
      }
    }

    return NextResponse.json({
      orderId: order.id.toString(),
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
