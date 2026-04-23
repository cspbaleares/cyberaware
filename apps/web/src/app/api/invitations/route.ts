import { NextRequest, NextResponse } from "next/server";
import { generateToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";

// POST /api/invitations - Crear invitación
// Nota: En producción, esto debería verificar que el usuario sea platform_admin
export async function POST(req: NextRequest) {
  try {
    const { email, tenantId, role = "tenant_admin", createdBy } = await req.json();

    if (!email || !tenantId) {
      return NextResponse.json({ error: "Email y tenantId requeridos" }, { status: 400 });
    }

    // Generar token JWT
    const token = generateToken({
      email,
      tenantId,
      role,
      type: "invitation",
    }, "7d");

    // Guardar en BD (llamar a API)
    const apiRes = await fetch(`${process.env.API_URL || "http://localhost:3001"}/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, tenantId, role, token, createdBy }),
    });

    if (!apiRes.ok) {
      const error = await apiRes.json();
      return NextResponse.json(error, { status: apiRes.status });
    }

    // Enviar email
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/register?token=${token}`;
    
    await sendEmail({
      to: email,
      subject: `Invitación a CyberAware`,
      html: `
        <h1>Has sido invitado a CyberAware</h1>
        <p>Has sido designado como administrador en CyberAware.</p>
        <p>Haz clic en el siguiente enlace para completar tu registro:</p>
        <a href="${invitationUrl}" style="display:inline-block;padding:12px 24px;background:#3b82f6;color:white;text-decoration:none;border-radius:8px;">Completar registro</a>
        <p>Este enlace expirará en 7 días.</p>
      `,
    });

    return NextResponse.json({ 
      success: true, 
      message: "Invitación enviada correctamente" 
    });

  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json({ error: "Error al crear invitación" }, { status: 500 });
  }
}

// GET /api/invitations - Listar invitaciones
export async function GET() {
  try {
    const apiRes = await fetch(`${process.env.API_URL || "http://localhost:3001"}/invitations`);

    if (!apiRes.ok) {
      return NextResponse.json({ error: "Error al obtener invitaciones" }, { status: apiRes.status });
    }

    const invitations = await apiRes.json();
    return NextResponse.json(invitations);

  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json({ error: "Error al obtener invitaciones" }, { status: 500 });
  }
}
