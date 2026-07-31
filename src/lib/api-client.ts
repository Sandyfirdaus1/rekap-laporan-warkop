/** Ambil JSON dari API internal; melempar Error dengan pesan dari server bila gagal. */
export async function fetchJson<T>(url: string, init?: RequestInit & { fallbackError?: string }): Promise<T> {
  const { fallbackError = "Gagal", ...requestInit } = init ?? {};
  const res = await fetch(url, requestInit);
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = (data as { error?: string } | null)?.error;
    throw new Error(message || fallbackError);
  }

  return data as T;
}

/** POST/PATCH JSON body ke API internal. */
export function sendJson<T>(
  url: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  body?: unknown,
  fallbackError?: string
): Promise<T> {
  return fetchJson<T>(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    fallbackError,
  });
}

export function errorMessage(e: unknown, fallback = "Gagal") {
  return e instanceof Error ? e.message : fallback;
}
