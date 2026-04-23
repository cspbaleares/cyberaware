import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/users - Listar usuarios del tenant actual
export async function GET() {
  try {
    const apiRes = await fetch(`${process.env.API_URL || "http://localhost:3001"}/admin/users`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!apiRes.ok) {
      const error = await apiRes.json();
      return NextResponse.json(error, { status: apiRes.status });
    }

    const users = await apiRes.json();
    return NextResponse.json({ users });

  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 });
  }
}

// POST /api/admin/invite - Invitar usuario al tenant
export async function POST(req: NextRequest) {
  try {
    const { email, role } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    // Obtener tenantId del usuario actual (desde la sesión)
    // Por ahora, llamamos a la API de invitaciones que ya existe
    const apiRes = await fetch(`${process.env.API_URL || "http://localhost:3001"}/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role: role || "user" }),
    });

    if (!apiRes.ok) {
      const error = await apiRes.json();
      return NextResponse.json(error, { status: apiRes.status });
    }

    const invitation = await apiRes.json();
    
    // Enviar email de invitación
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/register?token=${invitation.token}`;
    
    await fetch(`${process.env.API_URL || "http://localhost:3001"}/mail/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        subject: "Has sido invitado a CyberAware",
        html: `
          <h1>Invitación a CyberAware</h1>
          <p>Has sido invitado a unirte a una organización en CyberAware.</p>
          <a href="${invitationUrl}" style="display:inline-block;padding:12px 24px;background:#3b82f6;color:white;text-decoration:none;border-radius:8px;">Aceptar invitación</a>
          <p>Este enlace expirará en 7 días.</p>
        `,
      }),
    });

    return NextResponse.json({ 
      success: true, 
      message: "Invitación enviada correctamente" 
    });

  } catch (error) {
    console.error("Error inviting user:", error);
    return NextResponse.json({ error: "Error al invitar usuario" }, { status: 500 });
  }
}
