import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signAuthToken } from "@/lib/auth";
import { setAuthCookie } from "@/lib/auth-cookie";
import { badRequest, errorResponse, serverError } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return badRequest("Username dan password harus diisi");
    }

    const user = await prisma.users.findUnique({
      where: { username }
    });

    if (!user) {
      return errorResponse("Username atau password salah", 401);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return errorResponse("Username atau password salah", 401);
    }

    const token = await signAuthToken({ userId: user.id, username: user.username });
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username },
    });
  } catch (error) {
    return serverError(error, "Terjadi kesalahan saat login", {
      includeDetails: true,
      logPrefix: "Login error:",
    });
  }
}
