import { badRequest } from "@/lib/api-error";

export type LineItem = { productId: number; qty: number; unitPrice?: number };

/**
 * Memvalidasi daftar item dari body permintaan. Baris yang tidak valid
 * ditolak dengan 400, bukan dibuang diam-diam.
 */
export function parseLineItems(rawItems: unknown, emptyMessage: string): LineItem[] {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw badRequest(emptyMessage);
  }

  return rawItems.map((row, index) => {
    const position = index + 1;
    if (row === null || typeof row !== "object") {
      throw badRequest(`Item ke-${position} tidak valid`);
    }

    const { productId, qty, unitPrice } = row as {
      productId?: unknown;
      qty?: unknown;
      unitPrice?: unknown;
    };
    const parsedId = Number(productId);
    const parsedQty = Number(qty);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      throw badRequest(`Item ke-${position} tidak punya produk yang valid`);
    }
    if (!Number.isInteger(parsedQty) || parsedQty <= 0) {
      throw badRequest(`Jumlah item ke-${position} harus bilangan bulat lebih dari 0`);
    }

    if (unitPrice === undefined) {
      return { productId: parsedId, qty: parsedQty };
    }

    const parsedPrice = Number(unitPrice);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      throw badRequest(`Harga item ke-${position} tidak valid`);
    }

    return { productId: parsedId, qty: parsedQty, unitPrice: parsedPrice };
  });
}

export function parseOccurredAt(value: unknown): Date {
  if (value === undefined || value === null || value === "") return new Date();
  const date = new Date(value as string | number);
  if (Number.isNaN(date.getTime())) {
    throw badRequest("Tanggal tidak valid");
  }
  return date;
}
