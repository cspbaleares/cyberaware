import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AutomationRulesService {
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

  private defaults(tenantId: string, userId: string) {
    return [
      {
        id: crypto.randomUUID(),
        tenantId,
        title: 'Riesgo alto → formación intensiva',
        description: 'Sugiere intervención cuando un usuario entra en riesgo alto.',
        triggerType: 'risk_high',
        actionType: 'suggest_training',
        priority: 'high',
        targetTrainingId: null,
        targetModuleKey: 'module_3',
        cooldownMinutes: 120,
        isEnabled: true,
        createdById: userId,
      },
      {
        id: crypto.randomUUID(),
        tenantId,
        title: 'Riesgo medio → refuerzo preventivo',
        description: 'Propone contenido preventivo para usuarios con riesgo medio.',
        triggerType: 'risk_medium',
        actionType: 'suggest_training',
        priority: 'medium',
        targetTrainingId: null,
        targetModuleKey: 'module_3',
        cooldownMinutes: 240,
        isEnabled: true,
        createdById: userId,
      },
      {
        id: crypto.randomUUID(),
        tenantId,
        title: 'Catálogo insuficiente → revisión',
        description: 'Marca revisión cuando el catálogo interno no cubre bien las acciones.',
        triggerType: 'catalog_gap',
        actionType: 'review_catalog',
        priority: 'base',
        targetTrainingId: null,
        targetModuleKey: 'module_3',
        cooldownMinutes: 720,
        isEnabled: true,
        createdById: userId,
      },
    ];
  }

  async listRules(currentUser: any, status?: string, meta?: { ipAddress?: string; userAgent?: string }) {
    const tenantId = currentUser.tenantId;
    const where: any = { tenantId };

    if (status?.trim()) where.isEnabled = status.trim() === 'enabled';

    const items = await this.prisma.automationRule.findMany({
      where,
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'automation_rules.list',
      entityType: 'AutomationRule',
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: { total: items.length, filterStatus: status ?? null },
    });

    return { items, total: items.length };
  }

  async getRule(currentUser: any, id: string, meta?: { ipAddress?: string; userAgent?: string }) {
    const tenantId = currentUser.tenantId;

    const item = await this.prisma.automationRule.findFirst({
      where: { id, tenantId },
    });

    if (!item) throw new NotFoundException('Regla no encontrada');

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'automation_rules.get',
      entityType: 'AutomationRule',
      entityId: item.id,
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: { title: item.title, isEnabled: item.isEnabled },
    });

    return item;
  }

  async seedDefaults(currentUser: any, meta?: { ipAddress?: string; userAgent?: string }) {
    const tenantId = currentUser.tenantId;
    const existing = await this.prisma.automationRule.count({
      where: { tenantId },
    });

    if (existing === 0) {
      await this.prisma.automationRule.createMany({
        data: this.defaults(tenantId, currentUser.sub),
      });
    }

    const items = await this.prisma.automationRule.findMany({
      where: { tenantId },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'automation_rules.seed_defaults',
      entityType: 'AutomationRule',
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: { total: items.length },
    });

    return { items, total: items.length };
  }

  async toggleRule(
    currentUser: any,
    id: string,
    isEnabled?: boolean,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const tenantId = currentUser.tenantId;

    const existing = await this.prisma.automationRule.findFirst({
      where: { id, tenantId },
    });

    if (!existing) throw new NotFoundException('Regla no encontrada');

    const updated = await this.prisma.automationRule.update({
      where: { id },
      data: {
        isEnabled: isEnabled ?? !existing.isEnabled,
      },
    });

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'automation_rules.toggle',
      entityType: 'AutomationRule',
      entityId: updated.id,
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        previousEnabled: existing.isEnabled,
        newEnabled: updated.isEnabled,
        title: updated.title,
        targetModuleKey: updated.targetModuleKey,
      },
    });

    return updated;
  }

  async updateRule(
    currentUser: any,
    id: string,
    body: { priority?: string; targetModuleKey?: string | null; cooldownMinutes?: number; isEnabled?: boolean },
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const tenantId = currentUser.tenantId;

    const existing = await this.prisma.automationRule.findFirst({
      where: { id, tenantId },
    });

    if (!existing) throw new NotFoundException('Regla no encontrada');

    const updated = await this.prisma.automationRule.update({
      where: { id },
      data: {
        priority: body.priority ?? undefined,
        targetModuleKey: body.targetModuleKey === undefined ? undefined : body.targetModuleKey,
        cooldownMinutes: body.cooldownMinutes ?? undefined,
        isEnabled: body.isEnabled ?? undefined,
      },
    });

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'automation_rules.update',
      entityType: 'AutomationRule',
      entityId: updated.id,
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        title: updated.title,
        priority: updated.priority,
        targetModuleKey: updated.targetModuleKey,
        cooldownMinutes: updated.cooldownMinutes,
        isEnabled: updated.isEnabled,
      },
    });

    return updated;
  }

  async getMetrics(currentUser: any, meta?: { ipAddress?: string; userAgent?: string }) {
    const tenantId = currentUser.tenantId;

    const [total, enabled, suggestTraining, reviewCatalog] = await this.prisma.$transaction([
      this.prisma.automationRule.count({ where: { tenantId } }),
      this.prisma.automationRule.count({ where: { tenantId, isEnabled: true } }),
      this.prisma.automationRule.count({ where: { tenantId, actionType: 'suggest_training' } }),
      this.prisma.automationRule.count({ where: { tenantId, actionType: 'review_catalog' } }),
    ]);

    const result = { total, enabled, suggestTraining, reviewCatalog };

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'automation_rules.metrics',
      entityType: 'AutomationRule',
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: result,
    });

    return result;
  }
}
