import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/mysql";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
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

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const [existingUsers] = await pool.query(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );
    const existingUserRows = existingUsers as any[];
    
    if (existingUserRows.length > 0) {
      return NextResponse.json(
        { error: "Username sudah digunakan" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await pool.query(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username, hashedPassword]
    );
    const insertResult = result as any;
    const userId = insertResult.insertId;

    // Generate JWT
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "your-secret-key-change-this-in-production"
    );

    const token = await new SignJWT({ userId, username })
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
      user: { id: userId, username },
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mendaftar" },
      { status: 500 }
    );
  }
}
