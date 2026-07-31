"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { authInputClass } from "@/lib/ui";

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-[var(--foreground)] mb-2">
      {children}
    </label>
  );
}

export function TextField({ id, label, value, onChange, placeholder }: FieldProps) {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={authInputClass}
        placeholder={placeholder}
        required
      />
    </div>
  );
}

/** Input password dengan tombol lihat/sembunyikan. */
export function PasswordField({ id, label, value, onChange, placeholder }: FieldProps) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? Eye : EyeOff;

  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${authInputClass} pr-12`}
          placeholder={placeholder}
          required
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <Icon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
