import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/mysql";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password harus diisi" },
        { status: 400 }
      );
    }

    const [users] = await pool.query(
      "SELECT id, username, password FROM users WHERE username = ?",
      [username]
    );
    const userRows = users as any[];

    if (userRows.length === 0) {
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      );
    }

    const user = userRows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      );
    }

    // Generate JWT
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "your-secret-key-change-this-in-production"
    );

    const token = await new SignJWT({ userId: user.id, username: user.username })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("10m")
      .sign(secret);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username },
    });
  } catch (error) {
    console.error("Login error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Terjadi kesalahan saat login", details: errorMessage },
      { status: 500 }
    );
  }
}
