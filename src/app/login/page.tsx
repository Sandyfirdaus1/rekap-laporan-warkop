"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordField, TextField } from "@/components/auth/AuthField";
import { sendJson } from "@/lib/api-client";
import { authErrorClass, primaryButtonClass } from "@/lib/ui";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await sendJson("/api/auth/login", "POST", { username, password }, "Login gagal");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      subtitle="Login ke laporan penjualan warkop"
      footer={
        <>
          Belum punya akun?{" "}
          <a href="/register" className="font-medium text-[var(--accent)] hover:underline">
            Daftar
          </a>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          id="username"
          label="Username"
          value={username}
          onChange={setUsername}
          placeholder="Masukkan username"
        />
        <PasswordField
          id="password"
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="Masukkan password"
        />

        {error && (
          <div className={authErrorClass}>{error}</div>
        )}

        <button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? "Loading..." : "Login"}
        </button>
      </form>
    </AuthLayout>
  );
}
