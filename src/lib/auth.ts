import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getJwtSecret } from "./jwt";

export type AuthUser = {
  userId: unknown;
  username: unknown;
};

/**
 * Reads and verifies the auth-token cookie. Returns the token payload or null
 * when there is no valid session.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return { userId: payload.userId, username: payload.username };
  } catch {
    return null;
  }
}

type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; response: NextResponse };

/**
 * Guards an API route. On success returns the authenticated user; otherwise
 * returns a ready-to-send 401 response.
 */
export async function requireAuth(): Promise<AuthResult> {
  const user = await getAuthUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 }
      ),
    };
  }
  return { ok: true, user };
}
