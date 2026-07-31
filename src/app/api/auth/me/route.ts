import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getJwtSecret } from "@/lib/jwt";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, getJwtSecret());

    return NextResponse.json({
      user: {
        id: payload.userId,
        username: payload.username,
      },
    });
  } catch (error) {
    console.error("Me error:", error);
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
