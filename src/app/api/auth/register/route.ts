import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signAuthToken } from "@/lib/auth";
import { setAuthCookie } from "@/lib/auth-cookie";
import { badRequest, serverError } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return badRequest("Username dan password harus diisi");
    }

    if (password.length < 6) {
      return badRequest("Password minimal 6 karakter");
    }

    const existingUser = await prisma.users.findUnique({
      where: { username }
    });

    if (existingUser) {
      return badRequest("Username sudah digunakan");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: {
        username,
        password: hashedPassword
      }
    });
    const userId = user.id;

    const token = await signAuthToken({ userId, username });
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: { id: userId, username },
    });
  } catch (error) {
    return serverError(error, "Terjadi kesalahan saat mendaftar", { logPrefix: "Register error:" });
  }
}
