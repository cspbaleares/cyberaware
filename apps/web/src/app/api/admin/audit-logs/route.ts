import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/audit-logs - Obtener logs de auditoría
export async function GET() {
  try {
    // Llamar a la API interna
    const apiRes = await fetch(`${process.env.API_URL || "http://localhost:3001"}/admin/audit-logs`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!apiRes.ok) {
      // Si no existe el endpoint, devolvemos array vacío
      return NextResponse.json({ logs: [] });
    }

    const logs = await apiRes.json();
    return NextResponse.json({ logs });

  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json({ logs: [] });
  }
}
