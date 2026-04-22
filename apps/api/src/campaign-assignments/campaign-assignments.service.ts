import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssignCampaignDto } from './dto/assign-campaign.dto';
import { UpdateAssignmentStatusDto } from './dto/update-assignment-status.dto';

@Injectable()
export class CampaignAssignmentsService {
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

  private async getCampaignOrFail(tenantId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id: campaignId,
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        status: true,
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaña no encontrada');
    }

    return campaign;
  }

  async assignUsers(
    currentUser: any,
    campaignId: string,
    dto: AssignCampaignDto,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const tenantId = currentUser.tenantId;
    const campaign = await this.getCampaignOrFail(tenantId, campaignId);

    const userIds = [...new Set(dto.userIds.map((v) => v.trim()).filter(Boolean))];

    const users = await this.prisma.user.findMany({
      where: {
        tenantId,
        id: { in: userIds },
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    if (users.length !== userIds.length) {
      throw new BadRequestException('Uno o más usuarios no existen o no pertenecen al tenant');
    }

    const existing = await this.prisma.campaignAssignment.findMany({
      where: {
        campaignId,
        userId: { in: userIds },
        deletedAt: null,
      },
      select: {
        userId: true,
      },
    });

    if (existing.length > 0) {
      throw new ConflictException('Uno o más usuarios ya están asignados a la campaña');
    }

    await this.prisma.$transaction(
      users.map((user) =>
        this.prisma.campaignAssignment.create({
          data: {
            tenantId,
            campaignId,
            userId: user.id,
            assignedById: currentUser.sub,
            status: 'assigned',
          },
        }),
      ),
    );

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'campaign_assignments.assign',
      entityType: 'CampaignAssignment',
      entityId: campaignId,
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        campaignId,
        campaignName: campaign.name,
        assignedCount: users.length,
        userIds,
      },
    });

    return {
      campaignId,
      assignedCount: users.length,
      userIds,
    };
  }

  async listAssignments(
    currentUser: any,
    campaignId: string,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const tenantId = currentUser.tenantId;
    await this.getCampaignOrFail(tenantId, campaignId);

    const items = await this.prisma.campaignAssignment.findMany({
      where: {
        tenantId,
        campaignId,
        deletedAt: null,
      },
      orderBy: {
        assignedAt: 'desc',
      },
      select: {
        id: true,
        tenantId: true,
        campaignId: true,
        userId: true,
        assignedById: true,
        assignedAt: true,
        status: true,
        completedAt: true,
        user: {
          select: {
            email: true,
            fullName: true,
            isActive: true,
          },
        },
      },
    });

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'campaign_assignments.list',
      entityType: 'CampaignAssignment',
      entityId: campaignId,
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        campaignId,
        total: items.length,
      },
    });

    return items;
  }

  async updateAssignmentStatus(
    currentUser: any,
    assignmentId: string,
    dto: UpdateAssignmentStatusDto,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const tenantId = currentUser.tenantId;

    const existing = await this.prisma.campaignAssignment.findFirst({
      where: {
        id: assignmentId,
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        campaignId: true,
        userId: true,
        status: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Asignación no encontrada');
    }

    const updated = await this.prisma.campaignAssignment.update({
      where: { id: assignmentId },
      data: {
        status: dto.status,
        completedAt: dto.status === 'completed' ? new Date() : null,
      },
      select: {
        id: true,
        tenantId: true,
        campaignId: true,
        userId: true,
        assignedById: true,
        assignedAt: true,
        status: true,
        completedAt: true,
      },
    });

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'campaign_assignments.update_status',
      entityType: 'CampaignAssignment',
      entityId: updated.id,
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        campaignId: updated.campaignId,
        targetUserId: updated.userId,
        previousStatus: existing.status,
        newStatus: updated.status,
      },
    });

    return updated;
  }

  async unassign(
    currentUser: any,
    assignmentId: string,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const tenantId = currentUser.tenantId;

    const existing = await this.prisma.campaignAssignment.findFirst({
      where: {
        id: assignmentId,
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        campaignId: true,
        userId: true,
        status: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Asignación no encontrada');
    }

    const updated = await this.prisma.campaignAssignment.update({
      where: { id: assignmentId },
      data: {
        deletedAt: new Date(),
      },
      select: {
        id: true,
        tenantId: true,
        campaignId: true,
        userId: true,
        status: true,
        deletedAt: true,
      },
    });

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'campaign_assignments.unassign',
      entityType: 'CampaignAssignment',
      entityId: updated.id,
      severity: 'WARN',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        campaignId: updated.campaignId,
        targetUserId: updated.userId,
        previousStatus: existing.status,
      },
    });

    return updated;
  }

  async getAssignmentMetrics(
    currentUser: any,
    campaignId: string,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const tenantId = currentUser.tenantId;
    await this.getCampaignOrFail(tenantId, campaignId);

    const [total, assigned, inProgress, completed] = await this.prisma.$transaction([
      this.prisma.campaignAssignment.count({
        where: { tenantId, campaignId, deletedAt: null },
      }),
      this.prisma.campaignAssignment.count({
        where: { tenantId, campaignId, status: 'assigned', deletedAt: null },
      }),
      this.prisma.campaignAssignment.count({
        where: { tenantId, campaignId, status: 'in_progress', deletedAt: null },
      }),
      this.prisma.campaignAssignment.count({
        where: { tenantId, campaignId, status: 'completed', deletedAt: null },
      }),
    ]);

    const result = {
      campaignId,
      total,
      assigned,
      inProgress,
      completed,
    };

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'campaign_assignments.metrics',
      entityType: 'CampaignAssignment',
      entityId: campaignId,
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: result,
    });

    return result;
  }
}
