"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Plus, Minus, CreditCard, User, Phone, Coffee, Utensils } from "lucide-react";
import { idr } from "@/lib/format";
import { errorMessage, fetchJson } from "@/lib/fetch-json";

interface Product {
  id: string;
  name: string;
  unit: string;
  stock: number;
  sellPrice: number;
}

interface CartItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
  subtotal: number;
  stock: number;
}

export default function OrdersPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState<{ orderNumber: string; totalAmount: number; orderId: string } | null>(null);

  useEffect(() => {
    void fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoadError(null);
    try {
      const data = await fetchJson<Product[]>("/api/products", {
        fallbackMessage: "Gagal memuat produk",
      });
      setProducts(data.filter((p) => p.stock > 0));
    } catch (error) {
      setLoadError(errorMessage(error, "Gagal memuat produk"));
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.qty < product.stock) {
          return prev.map((item) =>
            item.productId === product.id
              ? { ...item, qty: item.qty + 1, subtotal: (item.qty + 1) * item.price }
              : item
          );
        }
        return prev;
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        qty: 1,
        price: product.sellPrice,
        subtotal: product.sellPrice,
        stock: product.stock,
      }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = delta > 0 ? Math.min(item.stock, item.qty + delta) : Math.max(0, item.qty + delta);
            return { ...item, qty: newQty, subtotal: newQty * item.price };
          }
          return item;
        })
        .filter((item) => item.qty > 0);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Keranjang masih kosong");
      return;
    }

    if (!customerName.trim()) {
      alert("Mohon isi nama pelanggan");
      return;
    }

    setProcessing(true);

    try {
      const data = await fetchJson<{ orderNumber: string; totalAmount: number; orderId: string }>(
        "/api/orders",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: cart,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
          }),
          fallbackMessage: "Gagal membuat pesanan",
        }
      );

      setOrderDetails({
        orderNumber: data.orderNumber,
        totalAmount: data.totalAmount,
        orderId: data.orderId,
      });
      setShowPaymentModal(true);
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
    } catch (error) {
      alert(errorMessage(error, "Gagal membuat pesanan"));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[var(--muted)]">Memuat produk...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Pesanan Baru</h1>
          <p className="text-sm text-[var(--muted)]">Input pesanan makanan dan minuman</p>
        </div>
      </div>

      {loadError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Utensils className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-medium text-[var(--foreground)]">Menu</h2>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[var(--card-border)] rounded-2xl">
              <Coffee className="h-12 w-12 mx-auto text-[var(--muted)] mb-3" />
              <p className="text-[var(--muted)]">Tidak ada produk tersedia</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="p-4 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] hover:border-[var(--accent)]/30 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-[var(--foreground)]">{product.name}</h3>
                      <p className="text-sm text-[var(--muted)]">Stok: {product.stock} {product.unit}</p>
                    </div>
                    <span className="text-lg font-semibold text-[var(--accent)]">
                      {idr(product.sellPrice)}
                    </span>
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[#1a1206] hover:bg-[var(--accent)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-medium text-[var(--foreground)]">Keranjang</h2>
          </div>

          <div className="p-4 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] space-y-4">
            {/* Customer Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-[var(--muted)]" />
                <input
                  type="text"
                  placeholder="Nama pelanggan"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="flex-1 bg-transparent border-none text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-0"
                />
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[var(--muted)]" />
                <input
                  type="tel"
                  placeholder="No. telepon (opsional)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="flex-1 bg-transparent border-none text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            <div className="border-t border-[var(--card-border)]" />

            {/* Cart Items */}
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-8 w-8 mx-auto text-[var(--muted)] mb-2" />
                <p className="text-sm text-[var(--muted)]">Keranjang kosong</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)] truncate">{item.name}</p>
                      <p className="text-xs text-[var(--muted)]">{idr(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQty(item.productId, -1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 text-[var(--foreground)] hover:bg-white/10 transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-[var(--foreground)]">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.productId, 1)}
                        disabled={item.qty >= item.stock}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 text-[var(--foreground)] hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-[var(--accent)]">
                        {idr(item.subtotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <>
                <div className="border-t border-[var(--card-border)]" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--muted)]">Total</span>
                  <span className="text-xl font-semibold text-[var(--accent)]">
                    {idr(totalAmount)}
                  </span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={processing}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-[#1a1206] hover:bg-[var(--accent)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <CreditCard className="h-4 w-4" />
                  {processing ? "Memproses..." : "Bayar Sekarang"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* QRIS Payment Modal */}
      {showPaymentModal && orderDetails && (
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
                <p className="font-mono font-medium text-[var(--foreground)]">{orderDetails.orderNumber}</p>
              </div>

              <div className="text-center">
                <p className="text-sm text-[var(--muted)]">Total Pembayaran</p>
                <p className="text-2xl font-bold text-[var(--accent)]">{idr(orderDetails.totalAmount)}</p>
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
                  onClick={async () => {
                    if (!orderDetails) return;
                    
                    try {
                      await fetchJson(`/api/orders/${orderDetails.orderId}/confirm-payment`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        fallbackMessage: 'Gagal mengkonfirmasi pembayaran',
                      });
                      alert('Pembayaran berhasil dikonfirmasi!');
                      setShowPaymentModal(false);
                      setOrderDetails(null);
                      await fetchProducts(); // Refresh products to show updated stock
                    } catch (error) {
                      alert(errorMessage(error, 'Gagal mengkonfirmasi pembayaran'));
                    }
                  }}
                  className="flex-1 rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                >
                  Sudah Bayar
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
