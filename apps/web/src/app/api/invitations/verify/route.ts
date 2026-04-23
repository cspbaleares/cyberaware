import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/tokens";

// GET /api/invitations/verify?token=xxx - Verificar token de invitación
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 400 });
    }

    // Verificar token JWT
    const payload = verifyToken(token);
    
    if (!payload || payload.type !== "invitation") {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 });
    }

    // Llamar a la API para verificar la invitación
    const apiRes = await fetch(`${process.env.API_URL || "http://localhost:3001"}/invitations/verify?token=${token}`);

    if (!apiRes.ok) {
      return NextResponse.json({ error: "Invitación inválida o expirada" }, { status: 400 });
    }

    const invitation = await apiRes.json();
    return NextResponse.json({
      valid: true,
      email: invitation.email,
      tenant: invitation.tenant,
      role: invitation.role,
    });

  } catch (error) {
    console.error("Error verifying invitation:", error);
    return NextResponse.json({ error: "Error al verificar invitación" }, { status: 500 });
  }
}

// POST /api/invitations/accept - Aceptar invitación y crear usuario
export async function POST(req: NextRequest) {
  try {
    const { token, firstName, lastName, password } = await req.json();

    if (!token || !firstName || !lastName || !password) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
    }

    // Llamar a la API para aceptar la invitación
    const apiRes = await fetch(`${process.env.API_URL || "http://localhost:3001"}/invitations/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, firstName, lastName, password }),
    });

    if (!apiRes.ok) {
      const error = await apiRes.json();
      return NextResponse.json(error, { status: apiRes.status });
    }

    const user = await apiRes.json();
    return NextResponse.json({
      success: true,
      message: "Registro completado correctamente",
      user,
    });

  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json({ error: "Error al completar registro" }, { status: 500 });
  }
}
