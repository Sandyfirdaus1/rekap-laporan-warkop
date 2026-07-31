"use client";

import clsx from "clsx";
import { LogOut } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/inventory", label: "Inventori" },
  { href: "/orders", label: "Pesanan" },
  { href: "/order-history", label: "Riwayat Pesanan" },
] as const;

/** Daftar link navigasi (dipakai sidebar desktop dan mobile). */
export function NavLinks({
  pathname,
  paddingClass,
  onNavigate,
}: {
  pathname: string;
  paddingClass: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {NAV_ITEMS.map((item) => (
        <a
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={clsx(
            "flex items-center gap-3 rounded-xl text-sm font-medium transition-colors",
            paddingClass,
            pathname === item.href
              ? "bg-[var(--accent)]/15 text-[var(--accent)] ring-1 ring-[var(--ring)]"
              : "text-[var(--muted)] hover:bg-white/5 hover:text-[var(--foreground)]"
          )}
        >
          {item.label}
        </a>
      ))}
    </>
  );
}

export function BrandHeader({ className }: { className: string }) {
  return (
    <div className={className}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dim)] text-[#1a1206] shadow-lg shadow-amber-900/30">
        ☕
      </span>
      <div>
        <p className="font-display text-lg font-semibold leading-tight text-[var(--foreground)]">
          Sudi Mampir
        </p>
        <p className="text-xs text-[var(--muted)]">Rekap harian</p>
      </div>
    </div>
  );
}

export function SidebarFooter({
  username,
  onLogout,
  className,
}: {
  username?: string;
  onLogout: () => void;
  className: string;
}) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--foreground)]">{username}</p>
          <p className="text-xs text-[var(--muted)]">Admin</p>
        </div>
        <button
          onClick={onLogout}
          className="rounded-lg p-2 text-[var(--muted)] hover:bg-white/5 hover:text-[var(--foreground)] transition-colors"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
