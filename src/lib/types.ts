export type ProductDoc = {
  id: number;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
  /** Diset 0; tidak dipakai di UI. */
  purchasePrice?: number;
  sellPrice: number;
  is_service?: boolean;
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
  id: number;
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
  id: number;
  occurredAt: Date;
  items: StockOutItem[];
  reason?: string;
  note?: string;
  createdAt: Date;
};

export type StockIntakeDoc = {
  id: number;
  productId: number;
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
  is_service?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ChartPoint = {
  label: string;
  revenue: number;
  transactions: number;
};

export type OrderItem = {
  productId: string;
  productName: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'expired';
  paymentMethod: string | null;
  midtransTransactionId: string | null;
  midtransPaymentType: string | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
};
