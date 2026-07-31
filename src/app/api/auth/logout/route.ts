import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth-cookie";
import { serverError } from "@/lib/api-response";

export async function POST() {
  try {
    await clearAuthCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError(error, "Terjadi kesalahan saat logout", { logPrefix: "Logout error:" });
  }
}
