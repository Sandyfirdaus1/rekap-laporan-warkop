"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import clsx from "clsx";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  History,
  LogOut,
  Coffee,
} from "lucide-react";

const IDLE_TIMEOUT = 10 * 60 * 1000;
const WARNING_TIMEOUT = 9 * 60 * 1000;

const navItems = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/inventory", label: "Inventori", Icon: Package },
  { href: "/orders", label: "Pesanan", Icon: ShoppingBag },
  { href: "/order-history", label: "Riwayat Pesanan", Icon: History },
];

function BrandBlock({ compact }: { compact?: boolean }) {
  return (
    <div className={clsx("flex items-center gap-3", compact ? "" : "px-1")}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--accent)]">
        <Coffee className="h-5 w-5" strokeWidth={2.2} />
      </span>
      <div>
        <p className="text-base font-bold leading-tight text-[var(--foreground)]">Sudi Mampir</p>
        {!compact && <p className="text-xs text-[var(--muted)]">Rekap harian</p>}
      </div>
    </div>
  );
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-0.5">
      <p className="section-label mb-2 px-3">Menu Utama</p>
      {navItems.map(({ href, label, Icon }) => (
        <a
          key={href}
          href={href}
          onClick={onNavigate}
          className={clsx("nav-link", pathname === href && "nav-link-active")}
        >
          <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
          {label}
        </a>
      ))}
    </nav>
  );
}

function UserFooter({ onLogout }: { onLogout: () => void }) {
  const [user, setUser] = useState<{ username: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      });
  }, []);

  return (
    <div className="border-t border-[var(--card-border)] pt-4">
      <div className="flex items-center gap-3 rounded-xl px-2 py-1">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-light)] text-sm font-bold text-[var(--accent)]">
          {user?.username?.charAt(0).toUpperCase() ?? "A"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--foreground)]">
            {user?.username ?? "Admin"}
          </p>
          <p className="text-xs text-[var(--muted)]">Administrator</p>
        </div>
        <button
          onClick={onLogout}
          className="rounded-lg p-2 text-[var(--muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--accent)]"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = async () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    setShowWarning(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (isAuthPage) return;

    warningTimerRef.current = setTimeout(() => setShowWarning(true), WARNING_TIMEOUT);
    idleTimerRef.current = setTimeout(() => void handleLogout(), IDLE_TIMEOUT);
  }, [isAuthPage]);

  useEffect(() => {
    if (isAuthPage) return;
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"];
    const onActivity = () => {
      if (showWarning) setShowWarning(false);
      resetIdleTimer();
    };
    events.forEach((e) => window.addEventListener(e, onActivity));
    resetIdleTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [isAuthPage, resetIdleTimer, showWarning]);

  return (
    <div className="min-h-screen bg-[var(--background)] md:flex">
      {showWarning && !isAuthPage && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center">
          <div className="card-surface mx-4 max-w-md p-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <LogOut className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">Sesi akan berakhir</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Anda tidak aktif selama 9 menit. Logout otomatis dalam 1 menit.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowWarning(false);
                    resetIdleTimer();
                  }}
                  className="btn-primary flex-1 py-2.5"
                >
                  Tetap Login
                </button>
                <button onClick={() => void handleLogout()} className="btn-ghost flex-1 py-2.5">
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isAuthPage && (
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[240px] flex-col border-r border-[var(--card-border)] bg-[var(--sidebar)] px-4 py-5 md:flex">
          <div className="mb-8">
            <BrandBlock />
          </div>
          <div className="flex flex-1 flex-col">
            <NavLinks pathname={pathname} />
          </div>
          <UserFooter onLogout={() => void handleLogout()} />
        </aside>
      )}

      <div className={`flex min-h-screen flex-1 flex-col ${!isAuthPage ? "md:pl-[240px]" : ""}`}>
        {!isAuthPage && (
          <div className="flex items-center justify-between border-b border-[var(--card-border)] bg-[var(--card)] px-4 py-3 md:hidden">
            <BrandBlock compact />
            <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
          </div>
        )}

        {!isAuthPage && mobileOpen && (
          <div className="border-b border-[var(--card-border)] bg-[var(--card)] px-4 py-4 md:hidden">
            <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            <div className="mt-4">
              <UserFooter onLogout={() => void handleLogout()} />
            </div>
          </div>
        )}

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
