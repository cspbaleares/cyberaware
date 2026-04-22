import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  private async writeAuditTx(
    tx: any,
    data: {
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
    },
  ) {
    await tx.auditLog.create({
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

  async listTenants() {
    return this.prisma.tenant.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getTenantById(id: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado');
    }

    return tenant;
  }

  async createTenant(
    dto: CreateTenantDto,
    currentUser: any,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const slug = dto.slug.trim().toLowerCase();
    const name = dto.name.trim();
    const adminEmail = dto.adminEmail.trim().toLowerCase();
    const adminFullName = dto.adminFullName.trim();

    const existingTenant = await this.prisma.tenant.findFirst({
      where: {
        OR: [{ name }, { slug }],
        deletedAt: null,
      },
      select: { id: true },
    });

    if (existingTenant) {
      throw new ConflictException('Ya existe un tenant con ese nombre o slug');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: adminEmail,
        deletedAt: null,
      },
      select: { id: true, tenantId: true },
    });

    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    const tenantAdminRole = await this.prisma.role.findFirst({
      where: {
        name: 'tenant_admin',
      },
      select: { id: true, name: true },
    });

    if (!tenantAdminRole) {
      throw new NotFoundException('Rol tenant_admin no encontrado');
    }

    const passwordHash = await argon2.hash(dto.temporaryPassword, {
      type: argon2.argon2id,
    });

    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name,
          slug,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: adminEmail,
          fullName: adminFullName,
          passwordHash,
          isActive: true,
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
        select: {
          id: true,
          tenantId: true,
          email: true,
          fullName: true,
          isActive: true,
          mustChangePassword: true,
          createdAt: true,
        },
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: tenantAdminRole.id,
        },
      });

      await this.writeAuditTx(tx, {
        tenantId: tenant.id,
        userId: currentUser.sub,
        action: 'tenants.create',
        entityType: 'Tenant',
        entityId: tenant.id,
        severity: 'INFO',
        status: 'SUCCESS',
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        metadata: {
          name: tenant.name,
          slug: tenant.slug,
          initialAdminEmail: user.email,
          initialAdminUserId: user.id,
        },
      });

      await this.writeAuditTx(tx, {
        tenantId: tenant.id,
        userId: currentUser.sub,
        action: 'users.create',
        entityType: 'User',
        entityId: user.id,
        severity: 'INFO',
        status: 'SUCCESS',
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        metadata: {
          email: user.email,
          fullName: user.fullName,
          createdByFlow: 'tenant-bootstrap',
        },
      });

      await this.writeAuditTx(tx, {
        tenantId: tenant.id,
        userId: currentUser.sub,
        action: 'users.assign_roles',
        entityType: 'User',
        entityId: user.id,
        severity: 'INFO',
        status: 'SUCCESS',
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        metadata: {
          roleNames: [tenantAdminRole.name],
          createdByFlow: 'tenant-bootstrap',
        },
      });

      return {
        ...tenant,
        initialAdmin: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          isActive: user.isActive,
          mustChangePassword: user.mustChangePassword,
        },
      };
    });

    return result;
  }

  async disableTenant(
    id: string,
    currentUser: any,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const previous = await this.prisma.tenant.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
      },
    });

    if (!previous) {
      throw new NotFoundException('Tenant no encontrado');
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: {
        isActive: false,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        updatedAt: true,
      },
    });

    await this.writeAudit({
      tenantId: updated.id,
      userId: currentUser.sub,
      action: 'tenants.disable',
      entityType: 'Tenant',
      entityId: updated.id,
      severity: 'WARN',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        name: updated.name,
        slug: updated.slug,
        previousIsActive: previous.isActive,
        isActive: updated.isActive,
      },
    });

    return updated;
  }

  async enableTenant(
    id: string,
    currentUser: any,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const previous = await this.prisma.tenant.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
      },
    });

    if (!previous) {
      throw new NotFoundException('Tenant no encontrado');
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        updatedAt: true,
      },
    });

    await this.writeAudit({
      tenantId: updated.id,
      userId: currentUser.sub,
      action: 'tenants.enable',
      entityType: 'Tenant',
      entityId: updated.id,
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        name: updated.name,
        slug: updated.slug,
        previousIsActive: previous.isActive,
        isActive: updated.isActive,
      },
    });

    return updated;
  }
}
