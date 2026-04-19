"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import clsx from "clsx";
import { LogOut } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ username: string } | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        }
      });
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
  };

  return (
    <div className="min-h-screen md:flex">
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
