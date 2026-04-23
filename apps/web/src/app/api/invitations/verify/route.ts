import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/tokens";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

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

    // Verificar que la invitación existe y no ha sido usada
    const invitation = await prisma.invitation.findFirst({
      where: {
        token,
        email: payload.email,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        tenant: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitación inválida o expirada" }, { status: 400 });
    }

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

    // Verificar token
    const payload = verifyToken(token);
    
    if (!payload || payload.type !== "invitation") {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 });
    }

    // Verificar invitación
    const invitation = await prisma.invitation.findFirst({
      where: {
        token,
        email: payload.email,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitación inválida o expirada" }, { status: 400 });
    }

    // Verificar que el email no esté ya registrado
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "El usuario ya existe" }, { status: 400 });
    }

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email: invitation.email,
        firstName,
        lastName,
        password: hashedPassword,
        tenantId: invitation.tenantId,
        roles: [invitation.role],
        emailVerified: new Date(),
      },
    });

    // Marcar invitación como usada
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { usedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: "Registro completado correctamente",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });

  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json({ error: "Error al completar registro" }, { status: 500 });
  }
}
