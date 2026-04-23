import { NextRequest, NextResponse } from "next/server";

// GET /api/platform/tenants - Listar tenants (proxy a API interna)
export async function GET() {
  try {
    const apiRes = await fetch(`${process.env.API_URL || "http://localhost:3001"}/platform/tenants`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!apiRes.ok) {
      const error = await apiRes.json();
      return NextResponse.json(error, { status: apiRes.status });
    }

    const tenants = await apiRes.json();
    return NextResponse.json({ tenants });

  } catch (error) {
    console.error("Error fetching tenants:", error);
    return NextResponse.json({ error: "Error al obtener tenants" }, { status: 500 });
  }
}
