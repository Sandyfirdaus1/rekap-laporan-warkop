"use client";

export function AuthLayout({
  subtitle,
  children,
  footer,
}: {
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dim)] text-[#1a1206] shadow-lg shadow-amber-900/30 text-3xl">
            ☕
          </span>
          <h1 className="mt-6 font-display text-2xl font-bold text-[var(--foreground)]">
            Warkop Sudi Mampir
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{subtitle}</p>
        </div>

        {children}

        <p className="mt-6 text-center text-sm text-[var(--muted)]">{footer}</p>
      </div>
    </div>
  );
}
