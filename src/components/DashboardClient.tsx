"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Download,
  Layers,
  Loader2,
  Package,
  PackageMinus,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from "lucide-react";
import clsx from "clsx";
import { SalesComboChart } from "@/components/dashboard/SalesComboChart";
import { StockByStatusPanel } from "@/components/dashboard/StockByStatusPanel";
import { StatCard } from "@/components/dashboard/StatCard";
import { SalesHistory } from "@/components/dashboard/SalesHistory";
import {
  RecordSaleCard,
  type LineDraft,
  type ProductOption,
} from "@/components/dashboard/RecordSaleCard";
import { idr } from "@/lib/format";

type Range = "today" | "week" | "month";

type StockRow = {
  id: string;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
};

type DashboardPayload = {
  range: Range;
  stats: {
    totalProducts: number;
    availableProducts: number;
    totalRevenue: number;
    transactionCount: number;
    totalQtySold: number;
    totalQtyStockOut: number;
    stockOutTransactionCount: number;
    totalQtyOut: number;
  };
  stockByStatus: {
    available: StockRow[];
    lowStock: StockRow[];
    outOfStock: StockRow[];
  };
  chart: {
    label: string;
    revenue: number;
    transactions: number;
    qtySold: number;
    qtyStockOut: number;
    totalQtyOut: number;
  }[];
};

type Sale = {
  id: string;
  occurredAt: string;
  total: number;
  items: {
    productId: string;
    name: string;
    qty: number;
    unitPrice: number;
    subtotal: number;
  }[];
};

type SalesResponse = {
  sales: Sale[];
};

export function DashboardClient() {
  const [range, setRange] = useState<Range>("today");
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);

  const [products, setProducts] = useState<ProductOption[]>([]);
  const [lines, setLines] = useState<LineDraft[]>([{ productId: "", qty: "1" }]);
  const [saleBusy, setSaleBusy] = useState(false);
  const [saleMsg, setSaleMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dashUrl = selectedDate
        ? `/api/dashboard?startDate=${selectedDate}`
        : `/api/dashboard?range=${range}`;
      const salesUrl = selectedDate
        ? `/api/sales?startDate=${selectedDate}`
        : `/api/sales?range=${range}`;

      const [dashRes, prodRes, salesRes] = await Promise.all([
        fetch(dashUrl, { cache: "no-store" }),
        fetch("/api/products", { cache: "no-store" }),
        fetch(salesUrl, { cache: "no-store" }),
      ]);
      if (!dashRes.ok) throw new Error("Gagal memuat dashboard");
      const dashJson = (await dashRes.json()) as DashboardPayload;
      setData(dashJson);

      if (prodRes.ok) {
        const list = await prodRes.json();
        setProducts(
          list.map((p: ProductOption & { id: string }) => ({
            id: p.id,
            name: p.name,
            unit: p.unit,
            stock: p.stock,
            sellPrice: p.sellPrice,
          }))
        );
      }

      if (salesRes.ok) {
        const salesJson = (await salesRes.json()) as SalesResponse;
        setSales(salesJson.sales);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [range, selectedDate]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const addLine = () => setLines((prev) => [...prev, { productId: "", qty: "1" }]);
  const setLine = (i: number, patch: Partial<LineDraft>) =>
    setLines((prev) => prev.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const removeLine = (i: number) =>
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)));

  const submitSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaleMsg(null);
    const items = lines
      .map((l) => ({ productId: l.productId, qty: Number(l.qty) }))
      .filter((l) => l.productId && l.qty > 0);
    if (items.length === 0) {
      setSaleMsg("Pilih produk dan jumlah.");
      return;
    }
    setSaleBusy(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Gagal menyimpan");
      setSaleMsg(`Tersimpan · Total ${idr(j.total)}`);
      setLines([{ productId: "", qty: "1" }]);
      await load();
    } catch (err) {
      setSaleMsg(err instanceof Error ? err.message : "Gagal");
    } finally {
      setSaleBusy(false);
    }
  };

  const exportExcel = async () => {
    if (!data) return;
    const XLSX = await import("xlsx");
    const { available, lowStock, outOfStock } = data.stockByStatus;
    const rows = [
      ["Warkop Sudi Mampir — Export Dashboard"],
      ["Periode filter", range],
      ["Total jenis barang (SKU)", data.stats.totalProducts],
      ["Produk tersedia (stok > min)", data.stats.availableProducts],
      ["Total pemasukan (periode)", data.stats.totalRevenue],
      ["Jumlah transaksi jual (periode)", data.stats.transactionCount],
      ["Unit terjual (qty)", data.stats.totalQtySold],
      ["Unit keluar non-jual (qty)", data.stats.totalQtyStockOut],
      ["Mutasi keluar non-jual (jumlah entri)", data.stats.stockOutTransactionCount],
      ["Total unit keluar (terjual + non-jual)", data.stats.totalQtyOut],
      [],
      [
        "Grafik — Label",
        "Pemasukan (IDR)",
        "Transaksi jual",
        "Qty terjual",
        "Qty keluar non-jual",
        "Total qty keluar",
      ],
      ...data.chart.map((c) => [
        c.label,
        c.revenue,
        c.transactions,
        c.qtySold,
        c.qtyStockOut,
        c.totalQtyOut,
      ]),
      [],
      ["Tersedia — Nama", "Stok", "Min"],
      ...available.map((p) => [p.name, p.stock, p.minStock]),
      [],
      ["Hampir habis — Nama", "Stok", "Min"],
      ...lowStock.map((p) => [p.name, p.stock, p.minStock]),
      [],
      ["Habis — Nama", "Stok", "Min"],
      ...outOfStock.map((p) => [p.name, p.stock, p.minStock]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap");
    XLSX.writeFile(wb, `rekap-sudi-mampir-${range}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const rangeTabs: { id: Range; label: string; desc: string }[] = [
    { id: "today", label: "Harian", desc: "Hari ini" },
    { id: "week", label: "Mingguan", desc: "7 hari terakhir" },
    { id: "month", label: "Bulanan", desc: "Bulan berjalan" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-1 max-w-xl text-sm text-[var(--muted)]">
            Penjualan, barang keluar (inventori), pemasukan, dan status stok.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex flex-wrap gap-2">
            {rangeTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                title={t.desc}
                onClick={() => setRange(t.id)}
                className={clsx(
                  "rounded-xl px-4 py-2 text-sm font-medium transition-all",
                  range === t.id
                    ? "bg-[var(--accent)] text-[#1a1206] shadow-md shadow-amber-900/25"
                    : "bg-white/5 text-[var(--muted)] ring-1 ring-[var(--card-border)] hover:bg-white/10"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void exportExcel()}
            disabled={!data || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-[var(--foreground)] ring-1 ring-[var(--card-border)] transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="flex items-center justify-center gap-2 py-24 text-[var(--muted)]">
          <Loader2 className="h-6 w-6 animate-spin" />
          Memuat data…
        </div>
      ) : data ? (
        <>
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="Total jenis barang"
              value={String(data.stats.totalProducts)}
              hint="SKU terdaftar"
              icon={Package}
              accent="amber"
            />
            <StatCard
              label="Produk tersedia"
              value={String(data.stats.availableProducts)}
              hint="Stok di atas batas minimum"
              icon={ShoppingBag}
              accent="emerald"
            />
            <StatCard
              label="Total pemasukan"
              value={idr(data.stats.totalRevenue)}
              hint={`${data.stats.transactionCount} transaksi jual`}
              icon={Wallet}
              accent="emerald"
            />
            <StatCard
              label="Unit terjual"
              value={String(data.stats.totalQtySold)}
              hint="Qty dari penjualan"
              icon={TrendingUp}
              accent="sky"
            />
            <StatCard
              label="Keluar (non-jual)"
              value={String(data.stats.totalQtyStockOut)}
              hint={`${data.stats.stockOutTransactionCount} pencatatan · stok berkurang`}
              icon={PackageMinus}
              accent="default"
            />
            <StatCard
              label="Total unit keluar"
              value={String(data.stats.totalQtyOut)}
              hint="Terjual + non-jual (periode)"
              icon={Layers}
              accent="amber"
            />
          </section>

          <RecordSaleCard
            products={products}
            lines={lines}
            saleBusy={saleBusy}
            saleMsg={saleMsg}
            onAddLine={addLine}
            onSetLine={setLine}
            onRemoveLine={removeLine}
            onSubmit={submitSale}
          />

          <SalesHistory sales={sales} selectedDate={selectedDate} onDateChange={setSelectedDate} />

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-5">
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)]/50 p-4 shadow-xl backdrop-blur-sm sm:p-5 xl:col-span-3">
              <h2 className="font-display text-lg font-semibold">Grafik penjualan &amp; barang keluar</h2>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                Batang: unit terjual + keluar non-jual. Garis: pemasukan &amp; transaksi jual.
              </p>
              <div className="mt-4">
                <SalesComboChart data={data.chart} mode={range} />
              </div>
            </div>
            <div className="xl:col-span-2">
              <StockByStatusPanel
                available={data.stockByStatus.available}
                lowStock={data.stockByStatus.lowStock}
                outOfStock={data.stockByStatus.outOfStock}
              />
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
