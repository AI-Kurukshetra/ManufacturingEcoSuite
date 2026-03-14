import { NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  getAdminSessionToken,
  isAdminAuthConfigured,
  validateAdminCredentials,
} from "@/lib/admin-auth";

function getCookieOptions() {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: "login" | "logout";
      username?: string;
      password?: string;
    };

    if (body.action === "logout") {
      const response = NextResponse.json({ ok: true });
      response.cookies.set(ADMIN_SESSION_COOKIE, "", {
        ...getCookieOptions(),
        expires: new Date(0),
      });
      return response;
    }

    if (!validateAdminCredentials(body.username ?? "", body.password ?? "")) {
      return NextResponse.json(
        { error: "Invalid admin credentials." },
        { status: 401 },
      );
    }

    const response = NextResponse.json({
      ok: true,
      authConfigured: isAdminAuthConfigured(),
    });

    if (isAdminAuthConfigured()) {
      response.cookies.set(ADMIN_SESSION_COOKIE, getAdminSessionToken(), {
        ...getCookieOptions(),
        maxAge: 60 * 60 * 8,
      });
    }

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update session." },
      { status: 400 },
    );
  }
}
