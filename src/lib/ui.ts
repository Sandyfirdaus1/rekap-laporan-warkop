/** Kelas Tailwind yang dipakai berulang di form aplikasi. */
export const inputClass =
  "w-full rounded-xl border border-[var(--card-border)] bg-[#0f0e0c] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)]";

export const qtyInputClass =
  "w-20 rounded-xl border border-[var(--card-border)] bg-[#0f0e0c] px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-[var(--ring)]";

export const authInputClass =
  "w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]";

export const authErrorClass =
  "rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-500";

export const errorBannerClass =
  "rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200";

export const primaryButtonClass =
  "w-full rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-dim)] px-4 py-3 text-sm font-semibold text-[#1a1206] shadow-lg shadow-amber-900/30 hover:shadow-amber-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all";
