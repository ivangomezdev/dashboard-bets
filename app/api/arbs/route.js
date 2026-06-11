import { NextResponse } from "next/server";
import { isRequestAuthenticated } from "@/lib/auth";
import { getArbsDashboardData } from "@/lib/arbs";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!isRequestAuthenticated(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const data = await getArbsDashboardData();
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error.message || "No se pudo leer el archivo" },
      { status: 500 }
    );
  }
}
