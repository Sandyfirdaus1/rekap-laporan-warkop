import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

/** Error dengan status HTTP yang aman untuk dikirim ke klien. */
export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "HttpError";
    this.status = status;
  }
}

export function badRequest(message: string) {
  return new HttpError(400, message);
}

export function notFound(message: string) {
  return new HttpError(404, message);
}

/** Membaca body JSON; melempar 400 (bukan 500) saat body bukan JSON valid. */
export async function readJsonBody(req: Request): Promise<Record<string, unknown>> {
  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch (cause) {
    throw new HttpError(400, "Body permintaan harus berupa JSON yang valid", { cause });
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new HttpError(400, "Body permintaan harus berupa objek JSON");
  }
  return parsed as Record<string, unknown>;
}

type ErrorResponseOptions = { notFoundMessage?: string };

function mapPrismaError(error: unknown, options: ErrorResponseOptions): HttpError | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return null;
  switch (error.code) {
    case "P2025":
      return new HttpError(404, options.notFoundMessage ?? "Data tidak ditemukan", {
        cause: error,
      });
    case "P2002":
      return new HttpError(409, "Data sudah ada", { cause: error });
    case "P2003":
      return new HttpError(409, "Data masih dipakai oleh entri lain", { cause: error });
    default:
      return null;
  }
}

/**
 * Menerjemahkan error menjadi response JSON: HttpError dan error Prisma yang
 * dikenal dipetakan ke status spesifik, sisanya jadi 500 dengan pesan umum.
 * Detail error selalu dicatat ke log server, tidak pernah dibocorkan ke klien.
 */
export function errorResponse(
  context: string,
  error: unknown,
  fallbackMessage: string,
  options: ErrorResponseOptions = {}
) {
  const mapped = error instanceof HttpError ? error : mapPrismaError(error, options);

  if (mapped && mapped.status < 500) {
    console.warn(`[${context}] ${mapped.status}: ${mapped.message}`, mapped.cause ?? "");
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }

  console.error(`[${context}]`, error);
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
