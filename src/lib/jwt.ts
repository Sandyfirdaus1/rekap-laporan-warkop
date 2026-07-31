// Edge- and Node-safe helper: no `next/headers` import here so this module can
// be used from both middleware (proxy) and route handlers.

/**
 * Returns the encoded JWT signing secret.
 * Throws if JWT_SECRET is not configured so we never fall back to a well-known
 * default key that would let anyone forge auth tokens.
 */
export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET tidak di-set. Tambahkan ke environment variables."
    );
  }
  return new TextEncoder().encode(secret);
}
