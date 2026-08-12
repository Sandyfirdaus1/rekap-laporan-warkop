"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, CheckCircle, Clock, XCircle, Search, Filter, CreditCard } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { idr } from "@/lib/format";

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
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [processing, setProcessing] = useState(false);

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
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (order: Order) => {
    setSelectedOrder(order);
    setShowPaymentMethodModal(true);
  };

  const handleSelectPaymentMethod = async (method: "cash" | "qris") => {
    if (!selectedOrder) return;

    if (method === "cash") {
      setShowPaymentMethodModal(false);
      await handleConfirmPayment("cash");
    } else {
      setShowPaymentMethodModal(false);
      setShowPaymentModal(true);
    }
  };

  const handleConfirmPayment = async (method: "cash" | "qris" = "qris") => {
    if (!selectedOrder) return;

    setProcessing(true);
    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: method }),
      });

      if (res.ok) {
        alert('Pembayaran berhasil dikonfirmasi!');
        setShowPaymentModal(false);
        setSelectedOrder(null);
        fetchOrders(); // Refresh orders to show updated status
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal mengkonfirmasi pembayaran');
      }
    } catch (error) {
      console.error('Payment confirmation error:', error);
      alert('Terjadi kesalahan saat mengkonfirmasi pembayaran');
    } finally {
      setProcessing(false);
    }
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
    <div className="mx-auto max-w-[1280px] space-y-6">
      <PageHeader title="Riwayat Pesanan" description="Daftar semua pesanan pelanggan" />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Cari nomor pesanan atau nama pelanggan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[var(--muted)]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "paid" | "pending")}
            className="input-field"
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
              className="card-surface space-y-4 p-4"
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
                    {new Date(order.createdAt).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
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

      {/* Payment Method Modal */}
      {showPaymentMethodModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--card-border)] p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Metode Pembayaran</h3>
              <button
                onClick={() => setShowPaymentMethodModal(false)}
                className="text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-[var(--muted)]">
              Pilih metode pembayaran untuk pesanan senilai{" "}
              <span className="font-semibold text-[var(--accent)]">{idr(selectedOrder.totalAmount)}</span>
            </p>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => handleSelectPaymentMethod("cash")}
                disabled={processing}
                className="flex items-center justify-between rounded-xl border border-[var(--card-border)] bg-white/5 px-4 py-4 text-left hover:border-[var(--accent)]/40 hover:bg-white/10 disabled:opacity-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-[var(--foreground)]">Cash</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">Langsung bayar lunas</p>
                </div>
                <span className="text-2xl">💵</span>
              </button>

              <button
                onClick={() => handleSelectPaymentMethod("qris")}
                disabled={processing}
                className="flex items-center justify-between rounded-xl border border-[var(--card-border)] bg-white/5 px-4 py-4 text-left hover:border-[var(--accent)]/40 hover:bg-white/10 disabled:opacity-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-[var(--foreground)]">QRIS</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">Scan QR lalu konfirmasi pembayaran</p>
                </div>
                <span className="text-2xl">📱</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QRIS Payment Modal */}
      {showPaymentModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--card-border)] p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Pembayaran QRIS</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-center">
                <p className="text-sm text-[var(--muted)]">Nomor Pesanan</p>
                <p className="font-mono font-medium text-[var(--foreground)]">{selectedOrder.orderNumber}</p>
              </div>

              <div className="text-center">
                <p className="text-sm text-[var(--muted)]">Total Pembayaran</p>
                <p className="text-2xl font-bold text-[var(--accent)]">{idr(selectedOrder.totalAmount)}</p>
              </div>

              <div className="bg-white rounded-xl p-4 flex items-center justify-center">
                <img
                  src="/images/qris/qris.jpeg"
                  alt="QRIS"
                  className="max-w-[200px] h-auto"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <p className="hidden text-center text-sm text-red-500">
                  Gambar QRIS belum tersedia.<br/>
                  Silakan upload gambar QRIS ke folder:<br/>
                  <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">public/images/qris/qris.jpeg</code>
                </p>
              </div>

              <p className="text-xs text-center text-[var(--muted)]">
                Scan QRIS di atas untuk membayar
              </p>
            </div>

            <div className="border-t border-[var(--card-border)] pt-4">
              <p className="text-sm font-medium text-[var(--foreground)] mb-3">Konfirmasi Pembayaran</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleConfirmPayment("qris")}
                  disabled={processing}
                  className="flex-1 rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {processing ? "Memproses..." : "Sudah Bayar"}
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 rounded-xl bg-[var(--card-border)] px-4 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--card-border)]/80 transition-colors"
                >
                  Belum
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}