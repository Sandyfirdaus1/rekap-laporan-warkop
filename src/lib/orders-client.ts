import { errorMessage, sendJson } from "@/lib/api-client";

/**
 * Konfirmasi pembayaran pesanan lalu tampilkan hasilnya.
 * Mengembalikan true bila berhasil.
 */
export async function confirmOrderPayment(orderId: string) {
  try {
    await sendJson(`/api/orders/${orderId}/confirm-payment`, "POST", undefined, "Gagal mengkonfirmasi pembayaran");
    alert("Pembayaran berhasil dikonfirmasi!");
    return true;
  } catch (error) {
    console.error("Payment confirmation error:", error);
    alert(errorMessage(error, "Terjadi kesalahan saat mengkonfirmasi pembayaran"));
    return false;
  }
}
