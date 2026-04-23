import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class InvitationsService {
  constructor(private prisma: PrismaService) {}

  async create(data: { email: string; tenantId: string; role?: string }, createdBy: string) {
    // Verificar que el tenant existe
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: data.tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado');
    }

    // Verificar que el email no esté ya registrado
    const existingUser = await this.prisma.user.findFirst({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new BadRequestException('El email ya está registrado');
    }

    // Generar token JWT
    const token = jwt.sign(
      { email: data.email, tenantId: data.tenantId, role: data.role || 'tenant_admin', type: 'invitation' },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' },
    );

    // Guardar invitación
    const invitation = await this.prisma.invitation.create({
      data: {
        email: data.email,
        tenantId: data.tenantId,
        role: data.role || 'tenant_admin',
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy,
      },
    });

    return invitation;
  }

  async findAll() {
    return this.prisma.invitation.findMany({
      where: {
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
      include: {
        tenant: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async verify(token: string) {
    // Verificar JWT
    let payload: any;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    } catch {
      throw new BadRequestException('Token inválido');
    }

    if (payload.type !== 'invitation') {
      throw new BadRequestException('Token inválido');
    }

    // Verificar en BD
    const invitation = await this.prisma.invitation.findFirst({
      where: {
        token,
        email: payload.email,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!invitation) {
      throw new BadRequestException('Invitación inválida o expirada');
    }

    return invitation;
  }

  async accept(data: { token: string; firstName: string; lastName: string; password: string }) {
    // Verificar invitación
    const invitation = await this.verify(data.token);

    // Verificar que el email no esté ya registrado
    const existingUser = await this.prisma.user.findFirst({
      where: { email: invitation.email },
    });

    if (existingUser) {
      throw new BadRequestException('El usuario ya existe');
    }

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Crear usuario
    const user = await this.prisma.user.create({
      data: {
        email: invitation.email,
        fullName: `${data.firstName} ${data.lastName}`,
        passwordHash: hashedPassword,
        tenantId: invitation.tenantId,
        isActive: true,
      },
    });

    // Buscar o crear rol
    let role = await this.prisma.role.findFirst({
      where: {
        tenantId: invitation.tenantId,
        name: invitation.role,
      },
    });

    if (!role) {
      role = await this.prisma.role.create({
        data: {
          tenantId: invitation.tenantId,
          name: invitation.role,
          description: `Rol ${invitation.role}`,
        },
      });
    }

    // Asignar rol
    await this.prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
      },
    });

    // Marcar invitación como usada
    await this.prisma.invitation.update({
      where: { id: invitation.id },
      data: { usedAt: new Date() },
    });

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    };
  }
}
