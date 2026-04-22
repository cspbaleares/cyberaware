import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { ListCampaignsDto } from './dto/list-campaigns.dto';

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly allowedStatuses = ['draft', 'scheduled', 'active', 'completed', 'archived'];

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

  private normalizeName(name: string) {
    return name.trim().replace(/\s+/g, ' ');
  }

  private validateDateRange(startsAt?: Date | null, endsAt?: Date | null) {
    if (startsAt && endsAt && startsAt > endsAt) {
      throw new BadRequestException('startsAt no puede ser mayor que endsAt');
    }
  }

  private validateStatus(status?: string) {
    if (!status) {
      return;
    }
    if (!this.allowedStatuses.includes(status)) {
      throw new BadRequestException('Estado de campaña no válido');
    }
  }

  async listCampaigns(
    currentUser: any,
    query?: ListCampaignsDto,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const tenantId = currentUser.tenantId;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const limit = query?.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;
    const skip = (page - 1) * limit;
    const includeArchived = query?.includeArchived === true;

    const where: any = {
      tenantId,
      deletedAt: includeArchived ? undefined : null,
    };

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.q?.trim()) {
      where.OR = [
        { name: { contains: query.q.trim(), mode: 'insensitive' } },
        { description: { contains: query.q.trim(), mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.campaign.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
        select: {
          id: true,
          tenantId: true,
          name: true,
          description: true,
          status: true,
          startsAt: true,
          endsAt: true,
          createdById: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      }),
      this.prisma.campaign.count({ where }),
    ]);

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'campaigns.list',
      entityType: 'Campaign',
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        page,
        limit,
        total,
        status: query?.status ?? null,
        q: query?.q ?? null,
        includeArchived,
      },
    });

    return {
      page,
      limit,
      total,
      items,
    };
  }

  async getCampaignById(currentUser: any, id: string, meta?: { ipAddress?: string; userAgent?: string }) {
    const tenantId = currentUser.tenantId;

    const item = await this.prisma.campaign.findFirst({
      where: {
        id,
        tenantId,
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        description: true,
        status: true,
        startsAt: true,
        endsAt: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Campaña no encontrada');
    }

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'campaigns.get',
      entityType: 'Campaign',
      entityId: item.id,
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        name: item.name,
        status: item.status,
        deletedAt: item.deletedAt,
      },
    });

    return item;
  }

  async createCampaign(
    currentUser: any,
    dto: CreateCampaignDto,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const tenantId = currentUser.tenantId;
    const name = this.normalizeName(dto.name);
    const startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : null;

    this.validateDateRange(startsAt, endsAt);

    const existing = await this.prisma.campaign.findFirst({
      where: {
        tenantId,
        name,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Ya existe una campaña activa con ese nombre');
    }

    const created = await this.prisma.campaign.create({
      data: {
        tenantId,
        name,
        description: dto.description?.trim() || null,
        status: 'draft',
        startsAt,
        endsAt,
        createdById: currentUser.sub,
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        description: true,
        status: true,
        startsAt: true,
        endsAt: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'campaigns.create',
      entityType: 'Campaign',
      entityId: created.id,
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        name: created.name,
        status: created.status,
      },
    });

    return created;
  }

  async updateCampaign(
    currentUser: any,
    id: string,
    dto: UpdateCampaignDto,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const tenantId = currentUser.tenantId;

    const existing = await this.prisma.campaign.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        startsAt: true,
        endsAt: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Campaña no encontrada');
    }

    this.validateStatus(dto.status);

    const newName =
      dto.name === undefined ? existing.name : this.normalizeName(dto.name);

    const startsAt =
      dto.startsAt === undefined
        ? existing.startsAt
        : dto.startsAt === null
        ? null
        : new Date(dto.startsAt);

    const endsAt =
      dto.endsAt === undefined
        ? existing.endsAt
        : dto.endsAt === null
        ? null
        : new Date(dto.endsAt);

    this.validateDateRange(startsAt, endsAt);

    if (newName !== existing.name) {
      const duplicate = await this.prisma.campaign.findFirst({
        where: {
          tenantId,
          name: newName,
          deletedAt: null,
          id: { not: id },
        },
        select: { id: true },
      });

      if (duplicate) {
        throw new ConflictException('Ya existe una campaña activa con ese nombre');
      }
    }

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: {
        name: newName,
        description: dto.description === undefined ? undefined : dto.description?.trim() || null,
        status: dto.status ?? existing.status,
        startsAt,
        endsAt,
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        description: true,
        status: true,
        startsAt: true,
        endsAt: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'campaigns.update',
      entityType: 'Campaign',
      entityId: updated.id,
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        previousName: existing.name,
        newName: updated.name,
        previousStatus: existing.status,
        newStatus: updated.status,
      },
    });

    return updated;
  }

  async archiveCampaign(currentUser: any, id: string, meta?: { ipAddress?: string; userAgent?: string }) {
    const tenantId = currentUser.tenantId;

    const existing = await this.prisma.campaign.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Campaña no encontrada');
    }

    const archived = await this.prisma.campaign.update({
      where: { id },
      data: {
        status: 'archived',
        deletedAt: new Date(),
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        description: true,
        status: true,
        startsAt: true,
        endsAt: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'campaigns.archive',
      entityType: 'Campaign',
      entityId: archived.id,
      severity: 'WARN',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        name: archived.name,
        previousStatus: existing.status,
        newStatus: archived.status,
      },
    });

    return archived;
  }

  async getCampaignMetrics(currentUser: any, meta?: { ipAddress?: string; userAgent?: string }) {
    const tenantId = currentUser.tenantId;

    const [total, draft, scheduled, active, completed, archived] = await this.prisma.$transaction([
      this.prisma.campaign.count({ where: { tenantId } }),
      this.prisma.campaign.count({ where: { tenantId, status: 'draft', deletedAt: null } }),
      this.prisma.campaign.count({ where: { tenantId, status: 'scheduled', deletedAt: null } }),
      this.prisma.campaign.count({ where: { tenantId, status: 'active', deletedAt: null } }),
      this.prisma.campaign.count({ where: { tenantId, status: 'completed', deletedAt: null } }),
      this.prisma.campaign.count({ where: { tenantId, status: 'archived' } }),
    ]);

    const result = {
      total,
      draft,
      scheduled,
      active,
      completed,
      archived,
    };

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'campaigns.metrics',
      entityType: 'Campaign',
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: result,
    });

    return result;
  }
}
