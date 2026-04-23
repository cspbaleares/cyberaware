import { NextRequest, NextResponse } from "next/server";
import { generateToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";

// Almacenamiento temporal de invitaciones (en producción debería ser BD)
const invitations: any[] = [];

// GET /api/admin/users - Listar usuarios del tenant actual
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("platform_access_token")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Decodificar token para obtener tenantId
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    const tenantId = tokenPayload.tenantId;

    // Llamar a la API interna para obtener usuarios
    const apiRes = await fetch(`${process.env.API_URL || "http://localhost:3001"}/users`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!apiRes.ok) {
      // Si la API falla, devolver array vacío
      return NextResponse.json({ users: [] });
    }

    const users = await apiRes.json();
    return NextResponse.json({ users });

  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ users: [] });
  }
}

// POST /api/admin/invite - Invitar usuario al tenant
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("platform_access_token")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { email, role } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    // Decodificar token para obtener info del usuario actual
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    const tenantId = tokenPayload.tenantId;
    const createdBy = tokenPayload.sub;

    // Generar token de invitación
    const invitationToken = generateToken({
      email,
      tenantId,
      role: role || "user",
      type: "invitation",
    }, "7d");

    // Guardar invitación en memoria
    const invitation = {
      id: Math.random().toString(36).substring(2, 9),
      email,
      tenantId,
      role: role || "user",
      token: invitationToken,
      createdBy,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    invitations.push(invitation);

    // Enviar email de invitación
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/register?token=${invitationToken}`;
    
    try {
      await sendEmail({
        to: email,
        subject: "Has sido invitado a CyberAware",
        html: `
          <h1>Has sido invitado a CyberAware</h1>
          <p>Has sido invitado a unirte a una organización en CyberAware.</p>
          <p>Haz clic en el siguiente enlace para completar tu registro:</p>
          <a href="${invitationUrl}" style="display:inline-block;padding:12px 24px;background:#3b82f6;color:white;text-decoration:none;border-radius:8px;">Completar registro</a>
          <p>Este enlace expirará en 7 días.</p>
        `,
      });
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      // Continuar aunque falle el email
    }

    return NextResponse.json({ 
      success: true, 
      message: "Invitación enviada correctamente",
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        createdAt: invitation.createdAt,
        expiresAt: invitation.expiresAt,
      }
    });

  } catch (error) {
    console.error("Error inviting user:", error);
    return NextResponse.json({ error: "Error al invitar usuario" }, { status: 500 });
  }
}
