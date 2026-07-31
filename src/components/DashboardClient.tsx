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
  FileText,
} from "lucide-react";
import clsx from "clsx";
import { SalesComboChart } from "@/components/dashboard/SalesComboChart";
import { TopProductsChart } from "@/components/dashboard/TopProductsChart";
import { PaymentMethodsChart } from "@/components/dashboard/PaymentMethodsChart";
import { StockByStatusPanel } from "@/components/dashboard/StockByStatusPanel";
import { StatCard } from "@/components/dashboard/StatCard";
import { SalesHistory } from "@/components/dashboard/SalesHistory";
import { idr } from "@/lib/format";

function formatChartLabel(label: string, mode: "today" | "week" | "month" | "year") {
  if (mode === "today") {
    return label.split(" ")[1] || label; // e.g. "09:00"
  }
  if (mode === "week") {
    const d = new Date(label);
    if (isNaN(d.getTime())) return label;
    return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short", year: "numeric" });
  }
  if (mode === "month") {
    const parts = label.split("-");
    return parts.length === 3 ? `Tanggal ${parts[2]}` : label;
  }
  if (mode === "year") {
    const parts = label.split("-");
    if (parts.length === 2) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
      return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    }
  }
  return label;
}

type Range = "today" | "week" | "month" | "year";

type StockRow = {
  id: string;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
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

type TopProduct = { name: string; qty: number; id: string };
type PaymentMethodStat = { method: string; count: number; total: number };

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
  topProducts: TopProduct[];
  paymentMethods: PaymentMethodStat[];
  recentSales?: Sale[];
};

const getTodayWIB = () => {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export function DashboardClient() {
  const [range, setRange] = useState<Range>("today");
  const [selectedDate, setSelectedDate] = useState(getTodayWIB());
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dashUrl = selectedDate
        ? `/api/dashboard?startDate=${selectedDate}`
        : `/api/dashboard?range=${range}`;

      const dashRes = await fetch(dashUrl, { cache: "no-store" });
      if (!dashRes.ok) throw new Error("Gagal memuat dashboard");
      const dashJson = (await dashRes.json()) as DashboardPayload;
      setData(dashJson);

      if (dashJson.recentSales) {
        setSales(dashJson.recentSales);
      } else {
        setSales([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [range, selectedDate]);

  useEffect(() => {
    void load();
  }, [load]);

  const exportExcel = async () => {
    if (!data) return;
    const XLSX = await import("xlsx");
    const { available, lowStock, outOfStock } = data.stockByStatus;
    const lowStockList = [...lowStock, ...outOfStock];

    const rows = [
      ["Laporan Dashboard Sudi Mampir"],
      ["Periode filter", `${range} ${selectedDate ? `(${selectedDate})` : ""}`],
      [],
      ["Metrik", "Nilai"],
      ["Total Pendapatan", data.stats.totalRevenue],
      ["Jumlah Transaksi", data.stats.transactionCount],
      ["Menu Terjual (qty)", data.stats.totalQtySold],
      ["Barang Keluar Non-jual", data.stats.totalQtyStockOut],
      ["Total Barang Keluar", data.stats.totalQtyOut],
      [],
      ["Rincian Penjualan (" + (range === "today" ? "Per Jam" : range === "week" ? "Per Hari" : range === "month" ? "Per Tanggal" : "Per Bulan") + ")"],
      ["Waktu", "Pendapatan"],
      ...data.chart.map(c => [formatChartLabel(c.label, range), c.revenue]),
      [],
      ...(data.topProducts.length > 0 ? [
        ["Menu Terlaris", "Terjual"],
        ...data.topProducts.map((p) => [p.name, p.qty]),
        []
      ] : []),
      ...(data.paymentMethods.length > 0 ? [
        ["Metode Pembayaran", "Jumlah", "Total"],
        ...data.paymentMethods.map((m) => [m.method, m.count, m.total]),
        []
      ] : []),
      ...(lowStockList.length > 0 ? [
        ["Peringatan Stok - Nama", "Sisa Stok", "Batas Min"],
        ...lowStockList.map((s) => [s.name, s.stock, s.minStock]),
        []
      ] : [])
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan");
    XLSX.writeFile(wb, `laporan-sudi-mampir-${range}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportPdf = async () => {
    if (!data) return;
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Laporan Dashboard Sudi Mampir", 14, 22);
      
      doc.setFontSize(11);
      doc.text(`Periode: ${range} ${selectedDate ? `(${selectedDate})` : ""}`, 14, 30);
      
      autoTable(doc, {
        startY: 36,
        head: [["Metrik", "Nilai"]],
        body: [
          ["Total Pendapatan", idr(data.stats.totalRevenue)],
          ["Jumlah Transaksi", data.stats.transactionCount],
          ["Menu Terjual (qty)", data.stats.totalQtySold],
          ["Barang Keluar Non-jual", data.stats.totalQtyStockOut],
          ["Total Barang Keluar", data.stats.totalQtyOut],
        ],
      });

      let finalY = (doc as any).lastAutoTable.finalY + 14;

      if (data.chart.length > 0) {
        if (finalY > 250) { doc.addPage(); finalY = 20; }
        doc.text(`Rincian Penjualan (${range === "today" ? "Per Jam" : range === "week" ? "Per Hari" : range === "month" ? "Per Tanggal" : "Per Bulan"})`, 14, finalY);
        autoTable(doc, {
          startY: finalY + 6,
          head: [["Waktu", "Pendapatan"]],
          body: data.chart.map(c => [formatChartLabel(c.label, range), idr(c.revenue)]),
        });
        finalY = (doc as any).lastAutoTable.finalY + 14;
      }

      if (data.topProducts.length > 0) {
        doc.text("Menu Terlaris", 14, finalY);
        autoTable(doc, {
          startY: finalY + 6,
          head: [["Nama Menu", "Terjual"]],
          body: data.topProducts.map(p => [p.name, p.qty]),
        });
        finalY = (doc as any).lastAutoTable.finalY + 14;
      }

      if (data.paymentMethods.length > 0) {
        if (finalY > 250) { doc.addPage(); finalY = 20; }
        doc.text("Metode Pembayaran", 14, finalY);
        autoTable(doc, {
          startY: finalY + 6,
          head: [["Metode", "Jumlah", "Total"]],
          body: data.paymentMethods.map(m => [m.method, m.count, idr(m.total)]),
        });
        finalY = (doc as any).lastAutoTable.finalY + 14;
      }

      const lowStockList = [...data.stockByStatus.lowStock, ...data.stockByStatus.outOfStock];
      if (lowStockList.length > 0) {
        if (finalY > 250) { doc.addPage(); finalY = 20; }
        doc.text("Peringatan Stok", 14, finalY);
        autoTable(doc, {
          startY: finalY + 6,
          head: [["Nama", "Sisa Stok", "Batas Min"]],
          body: lowStockList.map(s => [s.name, s.stock, s.minStock]),
        });
      }

      doc.save(`laporan-sudi-mampir-${range}-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Gagal membuat PDF");
    }
  };

  const rangeTabs: { id: Range; label: string; desc: string }[] = [
    { id: "today", label: "Harian", desc: "Hari ini" },
    { id: "week", label: "Mingguan", desc: "7 hari terakhir" },
    { id: "month", label: "Bulanan", desc: "Bulan berjalan" },
    { id: "year", label: "Tahunan", desc: "Tahun ini (Jan-Des)" },
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
          <div className="flex flex-wrap items-center gap-2">
            {rangeTabs.map((t) => {
              const isHariIni = t.id === "today" && selectedDate === getTodayWIB();
              const isActive = isHariIni || (range === t.id && !selectedDate);
              return (
                <button
                  key={t.id}
                  type="button"
                  title={t.desc}
                  onClick={() => {
                    if (t.id === "today") {
                      setSelectedDate(getTodayWIB());
                    } else {
                      setSelectedDate("");
                    }
                    setRange(t.id);
                  }}
                  className={clsx(
                    "rounded-xl px-4 py-2 text-sm font-medium transition-all",
                    isActive
                      ? "bg-[var(--accent)] text-[#1a1206] shadow-md shadow-amber-900/25 font-semibold"
                      : "bg-white/5 text-[var(--muted)] ring-1 ring-[var(--card-border)] hover:bg-white/10"
                  )}
                >
                  {t.label}
                </button>
              );
            })}
            {selectedDate && selectedDate !== getTodayWIB() && (
              <div className="flex items-center gap-1.5 rounded-xl bg-amber-500/15 px-3 py-2 text-xs font-medium text-amber-300 ring-1 ring-amber-500/30">
                <span>Filter Tgl: {selectedDate}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate("");
                    setRange("week"); // Default back to something if clearing custom date? Or just keep current range.
                    // Actually, let's just reset to today:
                    setSelectedDate(getTodayWIB());
                    setRange("today");
                  }}
                  className="rounded hover:text-white"
                  title="Reset Filter Tanggal"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="h-6 w-px bg-[var(--card-border)] mx-1 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void exportExcel()}
                disabled={!data || loading}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-500 ring-1 ring-green-500/30 transition-colors hover:bg-green-500/20 disabled:opacity-50"
                title="Export Excel"
              >
                <Download className="h-3.5 w-3.5" />
                Excel
              </button>
              <button
                type="button"
                onClick={() => void exportPdf()}
                disabled={!data || loading}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-500 ring-1 ring-red-500/30 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                title="Export PDF"
              >
                <FileText className="h-3.5 w-3.5" />
                PDF
              </button>
            </div>
          </div>
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
              label="🍽️ Total Menu / Produk"
              value={String(data.stats.totalProducts)}
              hint="Menu terdaftar"
              accent="amber"
            />
            <StatCard
              label="💰 Total Pendapatan"
              value={idr(data.stats.totalRevenue)}
              hint={`${data.stats.transactionCount} transaksi jual`}
              accent="emerald"
            />
            <StatCard
              label="🛒 Menu Terjual"
              value={String(data.stats.totalQtySold)}
              hint="Qty dari penjualan"
              accent="sky"
            />
            <StatCard
              label="📦 Pengeluaran Stok"
              value={String(data.stats.totalQtyStockOut)}
              hint={`${data.stats.stockOutTransactionCount} pencatatan non-jual`}
              accent="default"
            />
            <StatCard
              label="📊 Total Barang Keluar"
              value={String(data.stats.totalQtyOut)}
              hint="Terjual + non-jual"
              accent="amber"
            />
            <StatCard
              label="⚠️ Stok Perlu Perhatian"
              value={String(data.stockByStatus.lowStock.length + data.stockByStatus.outOfStock.length)}
              hint={`${data.stockByStatus.lowStock.length} menipis · ${data.stockByStatus.outOfStock.length} habis`}
              accent={data.stockByStatus.lowStock.length + data.stockByStatus.outOfStock.length > 0 ? "rose" : "default"}
            />
          </section>

          <section className="flex flex-col gap-6 mt-8">
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)]/50 p-4 shadow-xl backdrop-blur-sm sm:p-5">
              <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[var(--accent)]" />
                Grafik Penjualan
              </h2>
              <SalesComboChart data={data.chart} mode={range} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)]/50 p-4 shadow-xl backdrop-blur-sm sm:p-5">
                <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5 text-amber-500" />
                  Menu Terlaris
                </h2>
                <TopProductsChart data={data.topProducts} />
              </div>

              <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)]/50 p-4 shadow-xl backdrop-blur-sm sm:p-5">
                <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-emerald-500" />
                  Metode Pembayaran
                </h2>
                <PaymentMethodsChart data={data.paymentMethods} />
              </div>
            </div>

            <div>
              <StockByStatusPanel
                available={data.stockByStatus.available}
                lowStock={data.stockByStatus.lowStock}
                outOfStock={data.stockByStatus.outOfStock}
              />
            </div>
            
            <SalesHistory sales={sales} selectedDate={selectedDate} onDateChange={setSelectedDate} />
          </section>
        </>
      ) : null}
    </div>
  );
}
