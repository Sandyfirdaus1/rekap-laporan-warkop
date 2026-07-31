"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, CheckCircle, Clock, XCircle, Search, Filter, CreditCard } from "lucide-react";
import { dateTimeId, idr } from "@/lib/format";
import { fetchJson } from "@/lib/api-client";
import { confirmOrderPayment } from "@/lib/orders-client";
import { QrisPaymentModal } from "@/components/QrisPaymentModal";

interface OrderItem {
  productId: string;
  productName: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'expired';
  paymentMethod: string | null;
  createdAt: string;
  items: OrderItem[];
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending">("all");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (order.customerName && order.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.paymentStatus === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    try {
      setOrders(await fetchJson<Order[]>("/api/orders"));
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (order: Order) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedOrder) return;
    if (!(await confirmOrderPayment(selectedOrder.id))) return;

    setShowPaymentModal(false);
    setSelectedOrder(null);
    fetchOrders();
  };

  const getPaymentMethodBadge = (method: string | null) => {
    if (method === "cash") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600">
          Cash
        </span>
      );
    }
    if (method === "qris") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600">
          QRIS
        </span>
      );
    }
    return null;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600">
            <CheckCircle className="h-3 w-3" />
            Sudah Bayar
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-600">
            <Clock className="h-3 w-3" />
            Menunggu
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-600">
            <XCircle className="h-3 w-3" />
            Gagal
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-600">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[var(--muted)]">Memuat riwayat pesanan...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Riwayat Pesanan</h1>
          <p className="text-sm text-[var(--muted)]">Daftar semua pesanan pelanggan</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Cari nomor pesanan atau nama pelanggan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[var(--muted)]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "paid" | "pending")}
            className="px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
          >
            <option value="all">Semua Status</option>
            <option value="paid">Sudah Bayar</option>
            <option value="pending">Menunggu</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[var(--card-border)] rounded-2xl">
          <ShoppingCart className="h-12 w-12 mx-auto text-[var(--muted)] mb-3" />
          <p className="text-[var(--muted)]">
            {searchTerm || statusFilter !== "all" ? "Tidak ada pesanan yang cocok" : "Belum ada pesanan"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="p-4 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-mono text-sm font-medium text-[var(--foreground)]">
                      {order.orderNumber}
                    </p>
                    {getStatusBadge(order.paymentStatus)}
                    {getPaymentMethodBadge(order.paymentMethod)}
                  </div>
                  {order.customerName && (
                    <p className="text-sm text-[var(--muted)]">
                      Pelanggan: {order.customerName}
                      {order.customerPhone && ` • ${order.customerPhone}`}
                    </p>
                  )}
                  <p className="text-xs text-[var(--muted)] mt-1">
                    {dateTimeId(order.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-[var(--accent)]">
                    {idr(order.totalAmount)}
                  </p>
                </div>
              </div>

              <div className="border-t border-[var(--card-border)] pt-3">
                <p className="text-xs font-medium text-[var(--muted)] mb-2">Item Pesanan:</p>
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <div className="flex-1">
                        <p className="text-[var(--foreground)]">{item.productName}</p>
                        <p className="text-xs text-[var(--muted)]">
                          {item.qty} x {idr(item.unitPrice)}
                        </p>
                      </div>
                      <p className="font-medium text-[var(--foreground)]">{idr(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {order.paymentStatus === 'pending' && order.paymentMethod !== 'cash' && (
                <div className="border-t border-[var(--card-border)] pt-3">
                  <button
                    onClick={() => handlePayment(order)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[#1a1206] hover:bg-[var(--accent)]/90 transition-colors"
                  >
                    <CreditCard className="h-4 w-4" />
                    Bayar Sekarang
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showPaymentModal && selectedOrder && (
        <QrisPaymentModal
          orderNumber={selectedOrder.orderNumber}
          totalAmount={selectedOrder.totalAmount}
          onClose={() => setShowPaymentModal(false)}
          onConfirm={handleConfirmPayment}
        />
      )}

    </div>
  );
}