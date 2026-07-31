/** Error dari response HTTP yang tidak ok, membawa status dan pesan dari server. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ApiError";
    this.status = status;
  }
}

async function readErrorMessage(res: Response, fallback: string) {
  try {
    const body = await res.json();
    if (body && typeof body === "object" && typeof body.error === "string") {
      return body.error;
    }
  } catch {
    // Response bukan JSON (mis. halaman error HTML) — pakai pesan fallback.
  }
  return `${fallback} (HTTP ${res.status})`;
}

/**
 * Fetch yang selalu melempar saat response tidak ok atau body bukan JSON,
 * sehingga kegagalan tidak pernah lolos diam-diam sebagai data kosong.
 */
export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit & { fallbackMessage?: string }
): Promise<T> {
  const { fallbackMessage = "Permintaan gagal", ...requestInit } = init ?? {};

  let res: Response;
  try {
    res = await fetch(input, requestInit);
  } catch (cause) {
    throw new ApiError(0, "Tidak dapat terhubung ke server. Periksa koneksi Anda.", { cause });
  }

  if (!res.ok) {
    throw new ApiError(res.status, await readErrorMessage(res, fallbackMessage));
  }

  try {
    return (await res.json()) as T;
  } catch {
    throw new ApiError(res.status, "Respons server tidak valid");
  }
}

export function errorMessage(error: unknown, fallback = "Terjadi kesalahan") {
  return error instanceof Error && error.message ? error.message : fallback;
}
