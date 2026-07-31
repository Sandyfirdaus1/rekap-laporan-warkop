"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordField, TextField } from "@/components/auth/AuthField";
import { sendJson } from "@/lib/api-client";
import { authErrorClass, primaryButtonClass } from "@/lib/ui";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Password tidak cocok");
      return;
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    setLoading(true);

    try {
      await sendJson("/api/auth/register", "POST", { username, password }, "Registrasi gagal");
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
      subtitle="Buat akun baru"
      footer={
        <>
          Sudah punya akun?{" "}
          <a href="/login" className="font-medium text-[var(--accent)] hover:underline">
            Login
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
          placeholder="Minimal 6 karakter"
        />
        <PasswordField
          id="confirmPassword"
          label="Konfirmasi Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Ulangi password"
        />

        {error && <div className={authErrorClass}>{error}</div>}

        <button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? "Loading..." : "Daftar"}
        </button>
      </form>
    </AuthLayout>
  );
}
