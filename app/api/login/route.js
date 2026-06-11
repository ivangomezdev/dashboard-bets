import { NextResponse } from "next/server";
import { createSessionCookie, verifyPassword } from "@/lib/auth";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  if (!verifyPassword(body.password || "")) {
    return NextResponse.json({ ok: false, message: "Clave incorrecta" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(createSessionCookie());
  return response;
}
