"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import clsx from "clsx";
import { LogOut } from "lucide-react";

const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds
const WARNING_TIMEOUT = 14 * 60 * 1000; // 14 minutes (1 minute before logout)

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetIdleTimer = useCallback(() => {
    // Clear existing timers
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);

    // Don't set timers on auth pages
    if (isAuthPage) return;

    // Set warning timer (1 minute before logout)
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
    }, WARNING_TIMEOUT);

    // Set logout timer
    idleTimerRef.current = setTimeout(() => {
      handleLogout();
    }, IDLE_TIMEOUT);
  }, [isAuthPage]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        }
      });
  }, []);

  // Setup idle detection
  useEffect(() => {
    if (isAuthPage) return;

    const activityEvents = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"];

    const handleActivity = () => {
      if (showWarning) setShowWarning(false);
      resetIdleTimer();
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Start the initial timer
    resetIdleTimer();

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [isAuthPage, resetIdleTimer, showWarning]);

  const handleLogout = async () => {
    // Clear timers before logout
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    setShowWarning(false);

    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
  };

  return (
    <div className="min-h-screen md:flex">
      {/* Idle timeout warning */}
      {showWarning && !isAuthPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 max-w-md rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-500">
                <LogOut className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                Sesi akan berakhir
              </h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Anda tidak aktif selama 14 menit. Anda akan otomatis logout dalam 1 menit karena keamanan.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowWarning(false);
                    resetIdleTimer();
                  }}
                  className="flex-1 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[#1a1206] hover:bg-[var(--accent)]/90 transition-colors"
                >
                  Tetap Login
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-[var(--foreground)] ring-1 ring-[var(--card-border)] hover:bg-white/10 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar - fixed */}
      {!isAuthPage && (
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-[var(--card-border)] bg-[var(--card)]/80 px-4 py-6 backdrop-blur-md md:flex">
          <div className="mb-10 flex items-center gap-3 px-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dim)] text-[#1a1206] shadow-lg shadow-amber-900/30">
              ☕
            </span>
            <div>
              <p className="font-display text-lg font-semibold leading-tight text-[var(--foreground)]">
                Sudi Mampir
              </p>
              <p className="text-xs text-[var(--muted)]">Rekap harian</p>
            </div>
          </div>
          <nav className="flex flex-1 flex-col gap-1">
            <a href="/dashboard" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium bg-[var(--accent)]/15 text-[var(--accent)] ring-1 ring-[var(--ring)]">
              Dashboard
            </a>
            <a href="/inventory" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--muted)] hover:bg-white/5 hover:text-[var(--foreground)]">
              Inventori
            </a>
          </nav>

          <div className="border-t border-[var(--card-border)] pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">{user?.username}</p>
                <p className="text-xs text-[var(--muted)]">Admin</p>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg p-2 text-[var(--muted)] hover:bg-white/5 hover:text-[var(--foreground)] transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Mobile content area */}
      <div className={`flex-1 flex flex-col ${!isAuthPage ? "md:pl-64" : ""}`}>
        {/* Mobile hamburger - inline above content */}
        {!isAuthPage && (
          <div className="md:hidden px-4 pt-4">
            <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
          </div>
        )}

        {/* Mobile sidebar - inline, pushes content when open */}
        {!isAuthPage && mobileOpen && (
          <aside className="md:hidden w-full flex-shrink-0 flex-col border-r border-[var(--card-border)] bg-[#141210]/98 px-4 py-5">
            <div className="mb-8 flex items-center gap-3 rounded-xl px-1 py-1">
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
            <nav className="flex flex-col gap-1">
              <a href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium bg-[var(--accent)]/15 text-[var(--accent)] ring-1 ring-[var(--ring)]">
                Dashboard
              </a>
              <a href="/inventory" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[var(--muted)] hover:bg-white/5 hover:text-[var(--foreground)]">
                Inventori
              </a>
            </nav>

            <div className="border-t border-[var(--card-border)] pt-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">{user?.username}</p>
                  <p className="text-xs text-[var(--muted)]">Admin</p>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileOpen(false);
                  }}
                  className="rounded-lg p-2 text-[var(--muted)] hover:bg-white/5 hover:text-[var(--foreground)] transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </aside>
        )}

        <main className="flex-1 px-4 py-4 sm:px-6 lg:px-10 md:py-8">{children}</main>
        {!isAuthPage && (
          <footer className="border-t border-[var(--card-border)] px-6 py-4 text-center text-xs text-[var(--muted)]">
            Warkop Sudi Mampir · Rekap internal
          </footer>
        )}
      </div>
    </div>
  );
}
