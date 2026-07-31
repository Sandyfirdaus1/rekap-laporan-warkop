"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MinusCircle, Pencil, Plus, Trash2, PackagePlus } from "lucide-react";
import { idr } from "@/lib/format";
import { errorMessage, fetchJson, sendJson } from "@/lib/api-client";
import { errorBannerClass, inputClass } from "@/lib/ui";
import { QtyLineRows, type LineDraft } from "@/components/QtyLineRows";
import { ProductFields, type ProductDraft } from "@/components/inventory/ProductFields";

type Product = {
  id: string;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
  sellPrice: number;
};

const emptyProduct: ProductDraft = {
  name: "",
  unit: "pcs",
  stock: "0",
  minStock: "5",
  sellPrice: "0",
};

function draftPayload(draft: ProductDraft) {
  return {
    name: draft.name,
    unit: draft.unit,
    stock: Number(draft.stock),
    minStock: Number(draft.minStock),
    sellPrice: Number(draft.sellPrice),
  };
}

const STOCK_OUT_REASONS = [
  "Rusak",
  "Kadaluarsa",
  "Pakai sendiri",
  "Hilang",
  "Sampel",
  "Lainnya",
] as const;


export function InventoryClient() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newP, setNewP] = useState(emptyProduct);
  const [newBusy, setNewBusy] = useState(false);

  const [editing, setEditing] = useState<Product | null>(null);
  const [editDraft, setEditDraft] = useState<ProductDraft>(emptyProduct);
  const [editBusy, setEditBusy] = useState(false);

  const [outLines, setOutLines] = useState<LineDraft[]>([{ productId: "", qty: "1" }]);
  const [outReason, setOutReason] = useState<string>(STOCK_OUT_REASONS[0]);
  const [outNote, setOutNote] = useState("");
  const [outBusy, setOutBusy] = useState(false);
  const [outMsg, setOutMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(
        await fetchJson<Product[]>("/api/products", {
          cache: "no-store",
          fallbackError: "Gagal memuat inventori",
        })
      );
    } catch (e) {
      setError(errorMessage(e, "Error"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewBusy(true);
    try {
      await sendJson("/api/products", "POST", draftPayload(newP));
      setNewP(emptyProduct);
      await load();
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setNewBusy(false);
    }
  };

  const addOutLine = () => setOutLines((prev) => [...prev, { productId: "", qty: "1" }]);
  const setOutLine = (i: number, patch: Partial<LineDraft>) =>
    setOutLines((prev) => prev.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const removeOutLine = (i: number) =>
    setOutLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)));

  const submitStockOut = async (e: React.FormEvent) => {
    e.preventDefault();
    setOutMsg(null);
    const payloadItems = outLines
      .map((l) => ({ productId: l.productId, qty: Number(l.qty) }))
      .filter((l) => l.productId && l.qty > 0);
    if (payloadItems.length === 0) {
      setOutMsg("Pilih barang dan jumlah keluar.");
      return;
    }
    setOutBusy(true);
    try {
      const result = await sendJson<{ totalQty: number }>("/api/stock-out", "POST", {
        items: payloadItems,
        reason: outReason,
        note: outNote.trim() || undefined,
      });
      setOutMsg(`Tersimpan · Total ${result.totalQty} unit keluar`);
      setOutLines([{ productId: "", qty: "1" }]);
      setOutNote("");
      await load();
    } catch (err) {
      setOutMsg(errorMessage(err));
    } finally {
      setOutBusy(false);
    }
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setEditDraft({
      name: p.name,
      unit: p.unit,
      stock: String(p.stock),
      minStock: String(p.minStock),
      sellPrice: String(p.sellPrice),
    });
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setEditBusy(true);
    try {
      await sendJson(`/api/products/${editing.id}`, "PATCH", draftPayload(editDraft));
      setEditing(null);
      await load();
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setEditBusy(false);
    }
  };

  const remove = async (p: Product) => {
    if (!confirm(`Hapus "${p.name}" dari daftar?`)) return;
    try {
      await sendJson(`/api/products/${p.id}`, "DELETE");
      await load();
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Inventori</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Tambah barang, catat barang keluar (stok otomatis berkurang), dan kelola daftar.
        </p>
      </header>

      {error && <div className={errorBannerClass}>{error}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={createProduct}
        className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)]/50 p-5 shadow-xl backdrop-blur-sm"
      >
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
          <PackagePlus className="h-5 w-5 text-[var(--accent)]" />
          Barang baru
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <ProductFields
            draft={newP}
            onChange={(patch) => setNewP((s) => ({ ...s, ...patch }))}
            namePlaceholder="Contoh: Kopi tubruk"
            stockLabel="Stok awal"
            minStockLabel="Batas minimum"
          />
        </div>
        <button
          type="submit"
          disabled={newBusy}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-dim)] py-2.5 text-sm font-semibold text-[#1a1206] disabled:opacity-60"
        >
          {newBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Simpan barang
        </button>
      </form>

      <form
        onSubmit={submitStockOut}
        className="rounded-2xl border border-orange-500/20 bg-[var(--card)]/50 p-5 shadow-xl backdrop-blur-sm"
      >
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
          <MinusCircle className="h-5 w-5 text-orange-400" />
          Barang keluar
        </h2>
        <p className="mb-3 text-xs text-[var(--muted)]">
          Untuk rusak, konsumsi internal, dll. — <strong>bukan</strong> penjualan (itu lewat
          dashboard). Stok berkurang otomatis dan tampil di grafik dashboard.
        </p>
        <div className="space-y-2">
          <QtyLineRows
            products={items}
            lines={outLines}
            onSetLine={setOutLine}
            onRemoveLine={removeOutLine}
          />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs text-[var(--muted)]">Alasan</label>
            <select
              className={inputClass}
              value={outReason}
              onChange={(e) => setOutReason(e.target.value)}
            >
              {STOCK_OUT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-[var(--muted)]">Catatan (opsional)</label>
            <input
              className={inputClass}
              value={outNote}
              onChange={(e) => setOutNote(e.target.value)}
              placeholder="Detail tambahan…"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addOutLine}
            className="inline-flex items-center gap-1 rounded-xl bg-white/5 px-3 py-2 text-xs font-medium ring-1 ring-[var(--card-border)] hover:bg-white/10"
          >
            <Plus className="h-3.5 w-3.5" />
            Baris
          </button>
          <button
            type="submit"
            disabled={outBusy}
            className="inline-flex flex-1 min-w-[160px] items-center justify-center gap-2 rounded-xl bg-orange-600/90 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-900/25 disabled:opacity-60"
          >
            {outBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Simpan barang keluar
          </button>
        </div>
        {outMsg && <p className="mt-2 text-xs text-[var(--muted)]">{outMsg}</p>}
      </form>
      </div>

      <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)]/40 shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-[var(--card-border)] px-5 py-4">
          <h2 className="font-display text-lg font-semibold">Daftar barang</h2>
          {loading && <Loader2 className="h-5 w-5 animate-spin text-[var(--muted)]" />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--card-border)] text-[var(--muted)]">
                <th className="px-5 py-3 font-medium">Nama</th>
                <th className="px-3 py-3 font-medium">Stok</th>
                <th className="px-3 py-3 font-medium">Min</th>
                <th className="px-3 py-3 font-medium">Harga</th>
                <th className="px-5 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-[var(--card-border)]/60 hover:bg-white/[0.03]">
                  <td className="px-5 py-3 font-medium">
                    {p.name}
                    <span className="ml-2 text-xs text-[var(--muted)]">{p.unit}</span>
                  </td>
                  <td className="px-3 py-3 tabular-nums">{p.stock}</td>
                  <td className="px-3 py-3 tabular-nums text-[var(--muted)]">{p.minStock}</td>
                  <td className="px-3 py-3 tabular-nums text-emerald-300/90">{idr(p.sellPrice)}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="mr-2 inline-flex rounded-lg p-2 text-[var(--accent)] hover:bg-[var(--accent)]/10"
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(p)}
                      className="inline-flex rounded-lg p-2 text-red-300 hover:bg-red-500/10"
                      aria-label="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && items.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-[var(--muted)]">
              Belum ada barang. Tambahkan di formulir di atas.
            </p>
          )}
        </div>
      </section>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--card-border)] bg-[#141210] p-6 shadow-2xl"
            role="dialog"
            aria-modal
          >
            <h3 className="font-display text-xl font-semibold">Edit {editing.name}</h3>
            <form onSubmit={saveEdit} className="mt-4 grid gap-3 sm:grid-cols-2">
              <ProductFields
                draft={editDraft}
                onChange={(patch) => setEditDraft((s) => ({ ...s, ...patch }))}
                priceFullWidth
              />
              <div className="sm:col-span-2 mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="flex-1 rounded-xl bg-white/5 py-2.5 text-sm font-medium ring-1 ring-[var(--card-border)]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editBusy}
                  className="flex-1 rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-[#1a1206] disabled:opacity-60"
                >
                  {editBusy ? "Menyimpan…" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
