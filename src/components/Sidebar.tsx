"use client";

import { Menu, X } from "lucide-react";

export function Sidebar({ mobileOpen, setMobileOpen }: { mobileOpen: boolean; setMobileOpen: (open: boolean) => void }) {
  return (
    <div className="flex h-full items-center px-3 sm:px-4">
      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-expanded={mobileOpen}
        aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[var(--foreground)] ring-1 ring-[var(--card-border)] transition-colors hover:bg-white/10"
      >
        {mobileOpen ? <X className="h-5 w-5" strokeWidth={2} /> : <Menu className="h-5 w-5" strokeWidth={2} />}
      </button>
    </div>
  );
}
