import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

// POST /api/invitations - Crear invitación (solo platform_admin)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    // Verificar que sea platform_admin
    if (!session?.user?.isSuperAdmin && !session?.user?.roles?.includes("platform_admin")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { email, tenantId, role = "tenant_admin" } = await req.json();

    if (!email || !tenantId) {
      return NextResponse.json({ error: "Email y tenantId requeridos" }, { status: 400 });
    }

    // Verificar que el tenant existe
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
    }

    // Verificar que el email no esté ya registrado
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 400 });
    }

    // Generar token de invitación (expira en 7 días)
    const token = generateToken({
      email,
      tenantId,
      role,
      type: "invitation",
    }, "7d");

    // Guardar invitación en BD
    await prisma.invitation.create({
      data: {
        email,
        tenantId,
        role,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy: session.user.id,
      },
    });

    // Enviar email de invitación
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/register?token=${token}`;
    
    await sendEmail({
      to: email,
      subject: `Invitación a CyberAware - ${tenant.name}`,
      html: `
        <h1>Has sido invitado a CyberAware</h1>
        <p>Has sido designado como administrador de <strong>${tenant.name}</strong> en CyberAware.</p>
        <p>Haz clic en el siguiente enlace para completar tu registro:</p>
        <a href="${invitationUrl}" style="display:inline-block;padding:12px 24px;background:#3b82f6;color:white;text-decoration:none;border-radius:8px;">Completar registro</a>
        <p>Este enlace expirará en 7 días.</p>
        <p>Si no esperabas esta invitación, ignora este email.</p>
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

// GET /api/invitations - Listar invitaciones pendientes
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.isSuperAdmin && !session?.user?.roles?.includes("platform_admin")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const invitations = await prisma.invitation.findMany({
      where: {
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
      include: {
        tenant: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ invitations });

  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json({ error: "Error al obtener invitaciones" }, { status: 500 });
  }
}
