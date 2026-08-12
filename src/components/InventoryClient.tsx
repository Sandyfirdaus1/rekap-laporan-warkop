"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MinusCircle, Pencil, Plus, Trash2, PackagePlus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { idr } from "@/lib/format";

type Product = {
  id: string;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
  sellPrice: number;
  is_service?: boolean;
};

const emptyProduct = {
  name: "",
  unit: "pcs",
  stock: "0",
  minStock: "5",
  sellPrice: "0",
  is_service: false,
};

const STOCK_OUT_REASONS = [
  "Rusak",
  "Kadaluarsa",
  "Pakai sendiri",
  "Hilang",
  "Sampel",
  "Lainnya",
] as const;

type OutLine = { productId: string; qty: string };

export function InventoryClient() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newP, setNewP] = useState(emptyProduct);
  const [newBusy, setNewBusy] = useState(false);

  const [editing, setEditing] = useState<Product | null>(null);
  const [editDraft, setEditDraft] = useState({
    name: "",
    unit: "pcs",
    stock: "0",
    minStock: "5",
    sellPrice: "0",
    is_service: false,
  });
  const [editBusy, setEditBusy] = useState(false);

  const [outLines, setOutLines] = useState<OutLine[]>([{ productId: "", qty: "1" }]);
  const [outReason, setOutReason] = useState<string>(STOCK_OUT_REASONS[0]);
  const [outNote, setOutNote] = useState("");
  const [outBusy, setOutBusy] = useState(false);
  const [outMsg, setOutMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/products", { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal memuat inventori");
      const list = await res.json();
      setItems(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewBusy(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newP.name,
          unit: newP.unit,
          stock: Number(newP.stock),
          minStock: Number(newP.minStock),
          sellPrice: Number(newP.sellPrice),
          is_service: newP.is_service,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Gagal");
      setNewP(emptyProduct);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal");
    } finally {
      setNewBusy(false);
    }
  };

  const addOutLine = () => setOutLines((prev) => [...prev, { productId: "", qty: "1" }]);
  const setOutLine = (i: number, patch: Partial<OutLine>) =>
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
      const res = await fetch("/api/stock-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: payloadItems,
          reason: outReason,
          note: outNote.trim() || undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Gagal");
      setOutMsg(`Tersimpan · Total ${j.totalQty} unit keluar`);
      setOutLines([{ productId: "", qty: "1" }]);
      setOutNote("");
      await load();
    } catch (err) {
      setOutMsg(err instanceof Error ? err.message : "Gagal");
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
      is_service: p.is_service || false,
    });
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setEditBusy(true);
    try {
      const res = await fetch(`/api/products/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editDraft.name,
          unit: editDraft.unit,
          stock: Number(editDraft.stock),
          minStock: Number(editDraft.minStock),
          sellPrice: Number(editDraft.sellPrice),
          is_service: editDraft.is_service,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Gagal");
      setEditing(null);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal");
    } finally {
      setEditBusy(false);
    }
  };

  const remove = async (p: Product) => {
    if (!confirm(`Hapus "${p.name}" dari daftar?`)) return;
    try {
      const res = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Gagal");
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal");
    }
  };

  const inputClass = "input-field";

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      <PageHeader
        title="Inventori"
        description="Tambah barang, catat barang keluar, dan kelola daftar produk."
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
      <form
        onSubmit={createProduct}
        className="card-surface p-5"
      >
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
          <PackagePlus className="h-5 w-5 text-[var(--accent)]" />
          Barang baru
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs text-[var(--muted)]">Nama</label>
            <input
              className={inputClass}
              value={newP.name}
              onChange={(e) => setNewP((s) => ({ ...s, name: e.target.value }))}
              required
              placeholder="Contoh: Kopi tubruk"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--muted)]">Satuan</label>
            <input
              className={inputClass}
              value={newP.unit}
              onChange={(e) => setNewP((s) => ({ ...s, unit: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-[var(--muted)]">Stok awal</label>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={newP.stock}
              onChange={(e) => setNewP((s) => ({ ...s, stock: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-[var(--muted)]">Batas minimum</label>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={newP.minStock}
              onChange={(e) => setNewP((s) => ({ ...s, minStock: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-[var(--muted)]">Harga</label>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={newP.sellPrice}
              onChange={(e) => setNewP((s) => ({ ...s, sellPrice: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="is_service"
              checked={newP.is_service}
              onChange={(e) => setNewP((s) => ({ ...s, is_service: e.target.checked }))}
              className="h-4 w-4 rounded border-[var(--card-border)] text-[var(--accent)]"
            />
            <label htmlFor="is_service" className="text-xs text-[var(--muted)]">
              Jasa Seduh (harga bisa diinput manual saat transaksi)
            </label>
          </div>
        </div>
        <button
          type="submit"
          disabled={newBusy}
          className="btn-primary mt-4 inline-flex w-full items-center justify-center gap-2 py-2.5"
        >
          {newBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Simpan barang
        </button>
      </form>

      <form
        onSubmit={submitStockOut}
        className="card-surface border-orange-100 bg-orange-50/30 p-5"
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
          {outLines.map((line, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <select
                value={line.productId}
                onChange={(e) => setOutLine(i, { productId: e.target.value })}
                className={inputClass}
              >
                <option value="">Pilih barang</option>
                {items.filter(p => !p.is_service).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (stok {p.stock} {p.unit})
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={line.qty}
                onChange={(e) => setOutLine(i, { qty: e.target.value })}
                className="input-field w-20 tabular-nums py-2"
              />
              {outLines.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeOutLine(i)}
                  className="rounded-lg px-2 text-xs text-red-600 hover:bg-red-50"
                >
                  Hapus
                </button>
              )}
            </div>
          ))}
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
            className="btn-ghost inline-flex items-center gap-1 py-2 text-xs"
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

      <section className="card-surface overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--card-border)] px-5 py-4">
          <h2 className="font-display text-lg font-semibold">Daftar barang</h2>
          {loading && <Loader2 className="h-5 w-5 animate-spin text-[var(--muted)]" />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--card-border)] text-[var(--muted)]">
                <th className="px-5 py-3 font-medium">Nama</th>
                <th className="px-3 py-3 font-medium">Tipe</th>
                <th className="px-3 py-3 font-medium">Stok</th>
                <th className="px-3 py-3 font-medium">Min</th>
                <th className="px-3 py-3 font-medium">Harga</th>
                <th className="px-5 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-[var(--card-border)] hover:bg-[var(--surface-hover)]">
                  <td className="px-5 py-3 font-medium">
                    {p.name}
                    <span className="ml-2 text-xs text-[var(--muted)]">{p.unit}</span>
                  </td>
                  <td className="px-3 py-3">
                    {p.is_service ? (
                      <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                        Jasa Seduh
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        Barang
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 tabular-nums">{p.is_service ? '-' : p.stock}</td>
                  <td className="px-3 py-3 tabular-nums text-[var(--muted)]">{p.is_service ? '-' : p.minStock}</td>
                  <td className="px-3 py-3 tabular-nums text-emerald-700">{idr(p.sellPrice)}</td>
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
                      className="inline-flex rounded-lg p-2 text-red-600 hover:bg-red-50"
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
        <div className="modal-overlay fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <div className="card-surface max-h-[90vh] w-full max-w-lg overflow-y-auto p-6" role="dialog" aria-modal>
            <h3 className="font-display text-xl font-semibold">Edit {editing.name}</h3>
            <form onSubmit={saveEdit} className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs text-[var(--muted)]">Nama</label>
                <input
                  className={inputClass}
                  value={editDraft.name}
                  onChange={(e) => setEditDraft((s) => ({ ...s, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="text-xs text-[var(--muted)]">Satuan</label>
                <input
                  className={inputClass}
                  value={editDraft.unit}
                  onChange={(e) => setEditDraft((s) => ({ ...s, unit: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-[var(--muted)]">Stok</label>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={editDraft.stock}
                  onChange={(e) => setEditDraft((s) => ({ ...s, stock: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-[var(--muted)]">Min</label>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={editDraft.minStock}
                  onChange={(e) => setEditDraft((s) => ({ ...s, minStock: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-[var(--muted)]">Harga</label>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={editDraft.sellPrice}
                  onChange={(e) => setEditDraft((s) => ({ ...s, sellPrice: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit_is_service"
                  checked={editDraft.is_service}
                  onChange={(e) => setEditDraft((s) => ({ ...s, is_service: e.target.checked }))}
                  className="h-4 w-4 rounded border-[var(--card-border)] text-[var(--accent)]"
                />
                <label htmlFor="edit_is_service" className="text-xs text-[var(--muted)]">
                  Jasa Seduh (harga bisa diinput manual saat transaksi)
                </label>
              </div>
              <div className="sm:col-span-2 mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="btn-ghost flex-1 py-2.5"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editBusy}
                  className="btn-primary flex-1 py-2.5"
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
