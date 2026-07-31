import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const AUTH_COOKIE = "auth-token";
/** Umur sesi dalam detik (10 menit). */
export const AUTH_TOKEN_MAX_AGE = 60 * 10;

export type AuthPayload = JWTPayload & {
  userId: number | string;
  username: string;
};

function getJwtSecret() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET || "your-secret-key-change-this-in-production"
  );
}

export async function signAuthToken(payload: AuthPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${AUTH_TOKEN_MAX_AGE}s`)
    .sign(getJwtSecret());
}

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify(token, getJwtSecret());
  return payload as AuthPayload;
}
