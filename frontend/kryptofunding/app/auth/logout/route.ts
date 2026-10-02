import { NextResponse } from "next/server";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 0,
};

export async function GET() {
  const response = NextResponse.redirect(
    new URL("/auth/signin", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  );

  response.cookies.set("accessToken", "", cookieOptions);
  response.cookies.set("refreshToken", "", cookieOptions);

  return response;
}

export async function POST() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set("accessToken", "", cookieOptions);
  response.cookies.set("refreshToken", "", cookieOptions);

  return response;
}
