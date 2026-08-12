"use client";

import { Menu, X } from "lucide-react";

export function Sidebar({
  mobileOpen,
  setMobileOpen,
}: {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => setMobileOpen(!mobileOpen)}
      aria-expanded={mobileOpen}
      aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] transition-colors hover:bg-[var(--surface-hover)]"
    >
      {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </button>
  );
}
