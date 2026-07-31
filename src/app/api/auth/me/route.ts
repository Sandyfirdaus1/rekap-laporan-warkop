import { NextResponse } from "next/server";
import { errors, jwtVerify } from "jose";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "your-secret-key-change-this-in-production"
    );

    const { payload } = await jwtVerify(token, secret);

    return NextResponse.json({
      user: {
        id: payload.userId,
        username: payload.username,
      },
    });
  } catch (error) {
    if (error instanceof errors.JOSEError) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    console.error("[GET /api/auth/me]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memuat sesi" },
      { status: 500 }
    );
  }
}
