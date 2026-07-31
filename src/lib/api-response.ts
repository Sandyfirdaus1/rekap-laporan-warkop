import { NextResponse } from "next/server";

export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function badRequest(message: string) {
  return errorResponse(message, 400);
}

export function notFound(message: string) {
  return errorResponse(message, 404);
}

type ServerErrorOptions = {
  /** Pakai pesan dari error asli sebagai `error` (fallback dipakai bila bukan Error). */
  useErrorMessage?: boolean;
  /** Sertakan pesan error asli pada field `details`. */
  includeDetails?: boolean;
  /** Prefix untuk log, mis. "Login error:". */
  logPrefix?: string;
};

/** Log error lalu balas 500 dengan bentuk body yang seragam. */
export function serverError(e: unknown, fallback: string, options: ServerErrorOptions = {}) {
  const { useErrorMessage = false, includeDetails = false, logPrefix } = options;
  if (logPrefix) console.error(logPrefix, e);
  else console.error(e);

  const originalMessage = e instanceof Error ? e.message : undefined;
  const message = useErrorMessage ? originalMessage ?? fallback : fallback;

  return NextResponse.json(
    includeDetails ? { error: message, details: originalMessage ?? "Unknown error" } : { error: message },
    { status: 500 }
  );
}
