import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("next/server", () => ({
  NextResponse: {
    next: vi.fn(() => ({ type: "next" })),
    redirect: vi.fn((url: URL | string) => ({
      type: "redirect",
      url: url.toString(),
      cookies: { delete: vi.fn() },
    })),
  },
}));

vi.mock("jose", () => ({
  jwtVerify: vi.fn(),
}));

import { proxy } from "./proxy";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const nextMock = vi.mocked(NextResponse.next);
const redirectMock = vi.mocked(NextResponse.redirect);
const jwtVerifyMock = vi.mocked(jwtVerify);

function makeRequest({ pathname, token }: { pathname: string; token?: string }): NextRequest {
  return {
    nextUrl: { pathname },
    url: `http://localhost:3000${pathname}`,
    cookies: {
      get: (name: string) =>
        name === "auth-token" && token ? { value: token } : undefined,
    },
  } as unknown as NextRequest;
}

describe("proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows public paths without checking the token", async () => {
    await proxy(makeRequest({ pathname: "/login" }));

    expect(nextMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).not.toHaveBeenCalled();
    expect(jwtVerifyMock).not.toHaveBeenCalled();
  });

  it("allows public API auth paths", async () => {
    await proxy(makeRequest({ pathname: "/api/auth/register" }));

    expect(nextMock).toHaveBeenCalledTimes(1);
    expect(jwtVerifyMock).not.toHaveBeenCalled();
  });

  it("redirects to /login when no token is present on a protected path", async () => {
    await proxy(makeRequest({ pathname: "/dashboard" }));

    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(redirectMock.mock.calls[0][0].toString()).toBe("http://localhost:3000/login");
    expect(jwtVerifyMock).not.toHaveBeenCalled();
  });

  it("allows the request through when the token is valid", async () => {
    jwtVerifyMock.mockResolvedValueOnce({} as never);

    await proxy(makeRequest({ pathname: "/dashboard", token: "valid-token" }));

    expect(jwtVerifyMock).toHaveBeenCalledTimes(1);
    expect(nextMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects and clears the cookie when the token is invalid", async () => {
    jwtVerifyMock.mockRejectedValueOnce(new Error("bad token"));

    const response = (await proxy(
      makeRequest({ pathname: "/dashboard", token: "invalid-token" }),
    )) as unknown as { cookies: { delete: ReturnType<typeof vi.fn> } };

    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(redirectMock.mock.calls[0][0].toString()).toBe("http://localhost:3000/login");
    expect(response.cookies.delete).toHaveBeenCalledWith("auth-token");
    expect(nextMock).not.toHaveBeenCalled();
  });
});
