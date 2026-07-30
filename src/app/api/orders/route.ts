import { NextResponse } from "next/server";
import pool from "@/lib/mysql";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, customerName, customerPhone } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Item pesanan wajib diisi" }, { status: 400 });
    }

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
      const [productRows] = await pool.query(
        "SELECT id, name, sell_price, stock FROM products WHERE id = ?",
        [productId]
      );
      const products = productRows as any[];
      
      if (products.length === 0) {
        return NextResponse.json({ error: `Produk dengan ID ${productId} tidak ditemukan` }, { status: 400 });
      }

      const product = products[0];
      
      if (product.stock < qty) {
        return NextResponse.json({ error: `Stok ${product.name} tidak cukup` }, { status: 400 });
      }

      const subtotal = product.sell_price * qty;
      totalAmount += subtotal;

      itemDetails.push({
        id: product.id.toString(),
        price: product.sell_price,
        quantity: qty,
        name: product.name,
      });
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create order in database
    const [orderResult] = await pool.query(
      `INSERT INTO orders (order_number, customer_name, customer_phone, total_amount, payment_status) 
       VALUES (?, ?, ?, ?, 'pending')`,
      [orderNumber, customerName || null, customerPhone || null, totalAmount]
    );
    const insertOrder = orderResult as any;
    const orderId = insertOrder.insertId;

    // Insert order items
    for (const item of items) {
      const productId = Number(item.productId);
      const qty = Number(item.qty);
      
      const [productRows] = await pool.query(
        "SELECT name, sell_price FROM products WHERE id = ?",
        [productId]
      );
      const products = productRows as any[];
      const product = products[0];
      const subtotal = product.sell_price * qty;

      await pool.query(
        `INSERT INTO order_items (order_id, product_id, product_name, qty, unit_price, subtotal) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, productId, product.name, qty, product.sell_price, subtotal]
      );
    }

    return NextResponse.json({
      orderId: orderId.toString(),
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

    let query = `
      SELECT 
        id,
        order_number as orderNumber,
        customer_name as customerName,
        customer_phone as customerPhone,
        total_amount as totalAmount,
        payment_status as paymentStatus,
        payment_method as paymentMethod,
        midtrans_transaction_id as midtransTransactionId,
        midtrans_payment_type as midtransPaymentType,
        created_at as createdAt,
        updated_at as updatedAt
      FROM orders 
      ORDER BY created_at DESC
    `;
    const params: any[] = [];

    if (status) {
      query += " WHERE payment_status = ?";
      params.push(status);
    }

    const [rows] = await pool.query(query, params);
    const orders = rows as any[];
    
    // Get order items for each order
    for (const order of orders) {
      const [itemsRows] = await pool.query(
        "SELECT product_id as productId, product_name as productName, qty, unit_price as unitPrice, subtotal FROM order_items WHERE order_id = ?",
        [order.id]
      );
      order.items = itemsRows as any[];
    }

    return NextResponse.json(orders);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal mengambil pesanan" }, { status: 500 });
  }
}
