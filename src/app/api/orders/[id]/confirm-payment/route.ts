import { NextResponse } from "next/server";
import pool from "@/lib/mysql";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = await params;
    const orderId = Number(id);

    if (!orderId || isNaN(orderId)) {
      return NextResponse.json({ error: "ID pesanan tidak valid" }, { status: 400 });
    }

    // Check if order exists and get current status
    const [orderRows] = await connection.query(
      "SELECT id, payment_status, customer_name, total_amount, created_at FROM orders WHERE id = ? FOR UPDATE",
      [orderId]
    );
    const orders = orderRows as any[];

    if (orders.length === 0) {
      await connection.rollback();
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    const order = orders[0];

    if (order.payment_status === 'paid') {
      await connection.rollback();
      return NextResponse.json({ error: "Pesanan sudah dikonfirmasi pembayarannya" }, { status: 400 });
    }

    // Get order items to update stock and create sale
    const [itemRows] = await connection.query(
      "SELECT product_id, product_name, qty, unit_price, subtotal FROM order_items WHERE order_id = ?",
      [orderId]
    );
    const items = itemRows as any[];

    // Update stock for each item
    for (const item of items) {
      await connection.query(
        "UPDATE products SET stock = stock - ?, updated_at = NOW() WHERE id = ?",
        [item.qty, item.product_id]
      );
    }

    // Create sale record for dashboard integration
    const [saleResult] = await connection.query(
      "INSERT INTO sales (occurred_at, total) VALUES (?, ?)",
      [order.created_at, order.total_amount]
    );
    const saleId = (saleResult as any).insertId;

    // Create sale items
    for (const item of items) {
      await connection.query(
        "INSERT INTO sale_items (sale_id, product_id, name, qty, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)",
        [saleId, item.product_id, item.product_name, item.qty, item.unit_price, item.subtotal]
      );
    }

    // Update payment status to 'paid'
    await connection.query(
      "UPDATE orders SET payment_status = 'paid', payment_method = 'QRIS', updated_at = NOW() WHERE id = ?",
      [orderId]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Pembayaran berhasil dikonfirmasi",
      orderId: orderId,
      customerName: order.customer_name
    });
  } catch (e) {
    await connection.rollback();
    console.error(e);
    return NextResponse.json({ error: "Gagal mengkonfirmasi pembayaran" }, { status: 500 });
  } finally {
    connection.release();
  }
}