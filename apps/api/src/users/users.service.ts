import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private toUserResponse(user: any) {
    return {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      fullName: user.fullName,
      isActive: user.isActive,
      isSuperAdmin: user.isSuperAdmin,
      mfaEnabled: user.mfaEnabled,
      mustChangePassword: user.mustChangePassword,
      failedLoginCount: user.failedLoginCount,
      lockedUntil: user.lockedUntil,
      lastLoginAt: user.lastLoginAt,
      passwordChangedAt: user.passwordChangedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
      roles: Array.isArray(user.memberships)
        ? user.memberships
            .map((ur: any) => ur.role?.name)
            .filter((v: unknown) => typeof v === 'string')
        : undefined,
    };
  }

  private async writeAudit(data: {
    tenantId: string;
    userId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    severity: string;
    status: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    await this.prisma.auditLog.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId ?? null,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId ?? null,
        severity: data.severity,
        status: data.status,
        source: 'api',
        requestId: null,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
        metadata: (data.metadata ?? {}) as any,
      },
    });
  }

  private async getTenantUserOrFail(tenantId: string, targetUserId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: targetUserId,
        tenantId,
        deletedAt: null,
      },
      include: {
        memberships: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async listUsers(currentUser: any, query: ListUsersDto, meta?: { ipAddress?: string; userAgent?: string }) {
    const tenantId = currentUser.tenantId;
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      deletedAt: null,
    };

    if (typeof query.isActive === 'string') {
      where.isActive = query.isActive === 'true';
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: {
          memberships: {
            include: {
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'users.list',
      entityType: 'User',
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        page,
        limit,
        total,
      },
    });

    return {
      page,
      limit,
      total,
      items: items.map((user) => this.toUserResponse(user)),
    };
  }

  async getUserById(currentUser: any, targetUserId: string, meta?: { ipAddress?: string; userAgent?: string }) {
    const tenantId = currentUser.tenantId;
    const user = await this.getTenantUserOrFail(tenantId, targetUserId);

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'users.get',
      entityType: 'User',
      entityId: user.id,
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        email: user.email,
      },
    });

    return this.toUserResponse(user);
  }

  async createUser(currentUser: any, dto: CreateUserDto, meta?: { ipAddress?: string; userAgent?: string }) {
    const tenantId = currentUser.tenantId;
    const email = dto.email.trim().toLowerCase();
    const fullName = dto.fullName.trim();

    const existing = await this.prisma.user.findFirst({
      where: {
        tenantId,
        email,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new BadRequestException('Ya existe un usuario con ese email en el tenant');
    }

    const passwordHash = await argon2.hash(dto.temporaryPassword, {
      type: argon2.argon2id,
    });

    const created = await this.prisma.user.create({
      data: {
        tenantId,
        email,
        fullName,
        passwordHash,
        isActive: dto.isActive ?? true,
        isSuperAdmin: false,
        mfaEnabled: false,
        mfaSecretEnc: null,
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: null,
        passwordChangedAt: null,
        mustChangePassword: true,
        deletedAt: null,
      },
      include: {
        memberships: {
          include: {
            role: true,
          },
        },
      },
    });

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'users.create',
      entityType: 'User',
      entityId: created.id,
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        email: created.email,
        fullName: created.fullName,
        mustChangePassword: true,
      },
    });

    return this.toUserResponse(created);
  }

  async disableUser(currentUser: any, targetUserId: string, meta?: { ipAddress?: string; userAgent?: string }) {
    const tenantId = currentUser.tenantId;

    if (currentUser.sub === targetUserId) {
      await this.writeAudit({
        tenantId,
        userId: currentUser.sub,
        action: 'users.self_disable_blocked',
        entityType: 'User',
        entityId: targetUserId,
        severity: 'WARN',
        status: 'FAILURE',
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        metadata: {},
      });

      throw new ForbiddenException('No puedes desactivarte a ti mismo');
    }

    const user = await this.getTenantUserOrFail(tenantId, targetUserId);

    if (user.isSuperAdmin && !currentUser.isSuperAdmin) {
      await this.writeAudit({
        tenantId,
        userId: currentUser.sub,
        action: 'users.disable_superadmin_blocked',
        entityType: 'User',
        entityId: user.id,
        severity: 'WARN',
        status: 'FAILURE',
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        metadata: {
          email: user.email,
        },
      });

      throw new ForbiddenException('No puedes desactivar un superadmin');
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isActive: false,
        failedLoginCount: 0,
        lockedUntil: null,
      },
      include: {
        memberships: {
          include: {
            role: true,
          },
        },
      },
    });

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'users.disable',
      entityType: 'User',
      entityId: updated.id,
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        email: updated.email,
      },
    });

    return this.toUserResponse(updated);
  }

  async enableUser(currentUser: any, targetUserId: string, meta?: { ipAddress?: string; userAgent?: string }) {
    const tenantId = currentUser.tenantId;
    const user = await this.getTenantUserOrFail(tenantId, targetUserId);

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isActive: true,
        failedLoginCount: 0,
        lockedUntil: null,
      },
      include: {
        memberships: {
          include: {
            role: true,
          },
        },
      },
    });

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'users.enable',
      entityType: 'User',
      entityId: updated.id,
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        email: updated.email,
      },
    });

    return this.toUserResponse(updated);
  }

  async assignRoles(currentUser: any, targetUserId: string, dto: AssignRolesDto, meta?: { ipAddress?: string; userAgent?: string }) {
    const tenantId = currentUser.tenantId;
    const roleNames = [...new Set(dto.roleNames.map((r) => r.trim()))];

    const user = await this.getTenantUserOrFail(tenantId, targetUserId);

    if (!user.isActive) {
      await this.writeAudit({
        tenantId,
        userId: currentUser.sub,
        action: 'users.roles.assign_inactive_blocked',
        entityType: 'User',
        entityId: user.id,
        severity: 'WARN',
        status: 'FAILURE',
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        metadata: {
          roleNames,
          email: user.email,
        },
      });

      throw new BadRequestException('No se pueden asignar roles a un usuario inactivo');
    }

    if (user.isSuperAdmin && !currentUser.isSuperAdmin) {
      await this.writeAudit({
        tenantId,
        userId: currentUser.sub,
        action: 'users.roles.assign_superadmin_blocked',
        entityType: 'User',
        entityId: user.id,
        severity: 'WARN',
        status: 'FAILURE',
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        metadata: {
          roleNames,
          email: user.email,
        },
      });

      throw new ForbiddenException('No puedes modificar roles de un superadmin');
    }

    const roles = await this.prisma.role.findMany({
      where: {
        tenantId,
        deletedAt: null,
        name: {
          in: roleNames,
        },
      },
    });

    if (roles.length !== roleNames.length) {
      throw new BadRequestException('Uno o más roles no existen en el tenant');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({
        where: {
          userId: user.id,
        },
      });

      for (const role of roles) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: role.id,
          },
        });
      }
    });

    const updated = await this.prisma.user.findFirst({
      where: {
        id: user.id,
        tenantId,
        deletedAt: null,
      },
      include: {
        memberships: {
          include: {
            role: true,
          },
        },
      },
    });

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'users.roles.assign',
      entityType: 'User',
      entityId: user.id,
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        roleNames,
      },
    });

    return this.toUserResponse(updated);
  }

  async adminResetPassword(
    currentUser: any,
    targetUserId: string,
    dto: AdminResetPasswordDto,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const tenantId = currentUser.tenantId;
    const user = await this.getTenantUserOrFail(tenantId, targetUserId);

    if (currentUser.sub === targetUserId) {
      await this.writeAudit({
        tenantId,
        userId: currentUser.sub,
        action: 'users.admin_password_reset_self_blocked',
        entityType: 'User',
        entityId: targetUserId,
        severity: 'WARN',
        status: 'FAILURE',
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        metadata: {},
      });

      throw new ForbiddenException('No puedes resetear tu propia contraseña por esta vía');
    }

    if (user.isSuperAdmin && !currentUser.isSuperAdmin) {
      await this.writeAudit({
        tenantId,
        userId: currentUser.sub,
        action: 'users.admin_password_reset_superadmin_blocked',
        entityType: 'User',
        entityId: user.id,
        severity: 'WARN',
        status: 'FAILURE',
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        metadata: {
          email: user.email,
        },
      });

      throw new ForbiddenException('No puedes resetear la contraseña de un superadmin');
    }

    const passwordHash = await argon2.hash(dto.newTemporaryPassword, {
      type: argon2.argon2id,
    });

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustChangePassword: true,
        passwordChangedAt: null,
        failedLoginCount: 0,
        lockedUntil: null,
      },
      include: {
        memberships: {
          include: {
            role: true,
          },
        },
      },
    });

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'users.admin_password_reset',
      entityType: 'User',
      entityId: updated.id,
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        email: updated.email,
        mustChangePassword: true,
      },
    });

    return this.toUserResponse(updated);
  }

  async adminResetMfa(
    currentUser: any,
    targetUserId: string,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const tenantId = currentUser.tenantId;
    const user = await this.getTenantUserOrFail(tenantId, targetUserId);

    if (currentUser.sub === targetUserId) {
      await this.writeAudit({
        tenantId,
        userId: currentUser.sub,
        action: 'users.admin_mfa_reset_self_blocked',
        entityType: 'User',
        entityId: targetUserId,
        severity: 'WARN',
        status: 'FAILURE',
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        metadata: {},
      });

      throw new ForbiddenException('No puedes resetear tu propio MFA por esta vía');
    }

    if (user.isSuperAdmin && !currentUser.isSuperAdmin) {
      await this.writeAudit({
        tenantId,
        userId: currentUser.sub,
        action: 'users.admin_mfa_reset_superadmin_blocked',
        entityType: 'User',
        entityId: user.id,
        severity: 'WARN',
        status: 'FAILURE',
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        metadata: {
          email: user.email,
        },
      });

      throw new ForbiddenException('No puedes resetear el MFA de un superadmin');
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        mfaEnabled: false,
        mfaSecretEnc: null,
      },
      include: {
        memberships: {
          include: {
            role: true,
          },
        },
      },
    });

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'users.admin_mfa_reset',
      entityType: 'User',
      entityId: updated.id,
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        email: updated.email,
      },
    });

    return this.toUserResponse(updated);
  }
}
