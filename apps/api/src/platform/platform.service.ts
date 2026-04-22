import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type RequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

const PLATFORM_MODULE_KEYS = ['module_1', 'module_2', 'module_3', 'module_4'] as const;

@Injectable()
export class PlatformService {
  constructor(private readonly prisma: PrismaService) {}

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
    const tenants = await this.prisma.tenant.findMany({
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
        tenantModuleAccesses: {
          where: {
            isEnabled: true,
          },
          orderBy: {
            moduleKey: 'asc',
          },
          select: {
            moduleKey: true,
          },
        },
      },
    });

    return tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      enabledModules: tenant.tenantModuleAccesses.map((item) => item.moduleKey),
    }));
  }

  async getTenantModules(tenantId: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        id: tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado');
    }

    const modules = await this.prisma.tenantModuleAccess.findMany({
      where: {
        tenantId,
      },
      orderBy: {
        moduleKey: 'asc',
      },
      select: {
        id: true,
        moduleKey: true,
        isEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const moduleMap = new Map(modules.map((module) => [module.moduleKey, module]));
    const normalizedModules = PLATFORM_MODULE_KEYS.map((moduleKey) => {
      const existing = moduleMap.get(moduleKey);

      return {
        id: existing?.id ?? `${tenantId}:${moduleKey}`,
        moduleKey,
        isEnabled: existing?.isEnabled ?? false,
        createdAt: existing?.createdAt ?? null,
        updatedAt: existing?.updatedAt ?? null,
      };
    });

    return {
      tenant,
      modules: normalizedModules,
    };
  }

  async updateTenantModule(
    tenantId: string,
    moduleKey: string,
    isEnabled: boolean,
    currentUser: any,
    meta?: RequestMeta,
  ) {
    if (!PLATFORM_MODULE_KEYS.includes(moduleKey as (typeof PLATFORM_MODULE_KEYS)[number])) {
      throw new BadRequestException('Módulo no permitido');
    }

    const tenant = await this.prisma.tenant.findFirst({
      where: {
        id: tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado');
    }

    const previous = await this.prisma.tenantModuleAccess.findUnique({
      where: {
        tenantId_moduleKey: {
          tenantId,
          moduleKey,
        },
      },
      select: {
        id: true,
        isEnabled: true,
      },
    });

    const updated = await this.prisma.tenantModuleAccess.upsert({
      where: {
        tenantId_moduleKey: {
          tenantId,
          moduleKey,
        },
      },
      create: {
        tenantId,
        moduleKey,
        isEnabled,
      },
      update: {
        isEnabled,
      },
      select: {
        id: true,
        tenantId: true,
        moduleKey: true,
        isEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await this.writeAudit({
      tenantId,
      userId: currentUser?.sub ?? currentUser?.id ?? null,
      action: 'platform.tenant_module.update',
      entityType: 'TenantModuleAccess',
      entityId: updated.id,
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        tenantName: tenant.name,
        tenantSlug: tenant.slug,
        moduleKey,
        previousIsEnabled: previous?.isEnabled ?? null,
        isEnabled: updated.isEnabled,
      },
    });

    return {
      tenant,
      module: updated,
    };
  }
}
