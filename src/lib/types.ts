import type { ObjectId } from "mongodb";

export type ProductDoc = {
  _id: ObjectId;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
  /** Diset 0; tidak dipakai di UI. */
  purchasePrice?: number;
  sellPrice: number;
  createdAt: Date;
  updatedAt: Date;
};

export type SaleItem = {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
};

export type SaleDoc = {
  _id: ObjectId;
  occurredAt: Date;
  items: SaleItem[];
  total: number;
  createdAt: Date;
};

/** Barang keluar tanpa penjualan (rusak, konsumsi, dll.) — stok berkurang. */
export type StockOutItem = {
  productId: string;
  name: string;
  qty: number;
};

export type StockOutDoc = {
  _id: ObjectId;
  occurredAt: Date;
  items: StockOutItem[];
  reason?: string;
  note?: string;
  createdAt: Date;
};

export type StockIntakeDoc = {
  _id: ObjectId;
  productId: ObjectId;
  productName: string;
  quantity: number;
  costPerUnit: number;
  note?: string;
  createdAt: Date;
};

export type ProductJSON = {
  id: string;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
  sellPrice: number;
  createdAt: string;
  updatedAt: string;
};

export type ChartPoint = {
  label: string;
  revenue: number;
  transactions: number;
};
