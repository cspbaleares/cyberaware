import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RiskScoringService } from '../risk-scoring/risk-scoring.service';
import { CreatePhishingSimulationDto } from './dto/create-phishing-simulation.dto';
import { UpdatePhishingSimulationDto } from './dto/update-phishing-simulation.dto';
import { AssignPhishingRecipientsDto } from './dto/assign-phishing-recipients.dto';
import { UpdatePhishingRecipientStatusDto } from './dto/update-phishing-recipient-status.dto';

@Injectable()
export class PhishingSimulationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly riskScoringService: RiskScoringService,
  ) {}

  private mapStatusTimestamp(status: string) {
    const now = new Date();
    if (status === 'sent') return { sentAt: now };
    if (status === 'opened') return { openedAt: now };
    if (status === 'clicked') return { clickedAt: now };
    if (status === 'submitted') return { submittedAt: now };
    if (status === 'reported') return { reportedAt: now };
    return {};
  }

  async listSimulations(tenantId: string, query: any) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const pageSize = Math.min(Math.max(Number(query.pageSize ?? 10), 1), 100);
    const skip = (page - 1) * pageSize;

    const where: any = {
      tenantId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.phishingSimulation.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          mailDomain: {
            select: {
              id: true,
              domain: true,
              status: true,
              type: true,
            },
          },
          template: {
            select: {
              id: true,
              name: true,
              status: true,
              subject: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
      }),
      this.prisma.phishingSimulation.count({ where }),
    ]);

    return {
      items,
      page,
      pageSize,
      total,
    };
  }

  async getSimulation(tenantId: string, id: string) {
    const simulation = await this.prisma.phishingSimulation.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!simulation) {
      throw new NotFoundException('Phishing simulation not found');
    }

    return simulation;
  }

  async createSimulation(tenantId: string, currentUser: any, dto: CreatePhishingSimulationDto) {
    const existing = await this.prisma.phishingSimulation.findFirst({
      where: {
        tenantId,
        name: dto.name,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException('An active phishing simulation with this name already exists');
    }

    let mailDomain: any = null;
    let template: any = null;

    if (dto.mailDomainId) {
      mailDomain = await this.prisma.tenantMailDomain.findFirst({
        where: {
          id: dto.mailDomainId,
          tenantId,
          deletedAt: null,
          type: 'simulation_sender',
        },
        select: {
          id: true,
          status: true,
          domain: true,
          type: true,
        },
      });

      if (!mailDomain) {
        throw new BadRequestException('Mail domain not found for tenant or invalid type');
      }
    }

    if (dto.templateId) {
      template = await this.prisma.phishingTemplate.findFirst({
        where: {
          id: dto.templateId,
          tenantId,
          deletedAt: null,
        },
        select: {
          id: true,
          status: true,
          name: true,
        },
      });

      if (!template) {
        throw new BadRequestException('Phishing template not found for tenant');
      }
    }

    const targetStatus = dto.status ?? 'draft';

    if (['scheduled', 'active'].includes(targetStatus)) {
      if (!mailDomain) {
        throw new BadRequestException('A verified simulation_sender mail domain is required for scheduled or active simulations');
      }

      if (mailDomain.status !== 'verified') {
        throw new BadRequestException('Mail domain must be verified before using scheduled or active status');
      }

      if (!template) {
        throw new BadRequestException('A phishing template is required for scheduled or active simulations');
      }

      if (template.status === 'archived') {
        throw new BadRequestException('Archived phishing templates cannot be used for scheduled or active simulations');
      }
    }

    const created = await this.prisma.phishingSimulation.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description ?? null,
        status: targetStatus,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        createdById: currentUser.sub ?? currentUser.id,
        mailDomainId: dto.mailDomainId ?? null,
        templateId: dto.templateId ?? null,
      },
      include: {
        mailDomain: {
          select: {
            id: true,
            domain: true,
            status: true,
            type: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            status: true,
            subject: true,
          },
        },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: currentUser.sub ?? currentUser.id,
        action: 'phishing_simulations.create',
        entityType: 'phishing_simulation',
        entityId: created.id,
        metadata: {
          name: created.name,
          status: created.status,
          mailDomainId: created.mailDomainId ?? null,
          templateId: created.templateId ?? null,
        },
      },
    });

    return created;
  }

  async updateSimulation(tenantId: string, id: string, currentUser: any, dto: UpdatePhishingSimulationDto) {
    const simulation = await this.prisma.phishingSimulation.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!simulation) {
      throw new NotFoundException('Phishing simulation not found');
    }

    if (dto.name && dto.name !== simulation.name) {
      const existing = await this.prisma.phishingSimulation.findFirst({
        where: {
          tenantId,
          name: dto.name,
          deletedAt: null,
          NOT: { id },
        },
        select: { id: true },
      });

      if (existing) {
        throw new BadRequestException('An active phishing simulation with this name already exists');
      }
    }

    const effectiveMailDomainId =
      dto.mailDomainId !== undefined ? dto.mailDomainId : simulation.mailDomainId;

    const effectiveTemplateId =
      dto.templateId !== undefined ? dto.templateId : simulation.templateId;

    let mailDomain: any = null;
    let template: any = null;

    if (effectiveMailDomainId) {
      mailDomain = await this.prisma.tenantMailDomain.findFirst({
        where: {
          id: effectiveMailDomainId,
          tenantId,
          deletedAt: null,
          type: 'simulation_sender',
        },
        select: {
          id: true,
          status: true,
          domain: true,
          type: true,
        },
      });

      if (!mailDomain) {
        throw new BadRequestException('Mail domain not found for tenant or invalid type');
      }
    }

    if (effectiveTemplateId) {
      template = await this.prisma.phishingTemplate.findFirst({
        where: {
          id: effectiveTemplateId,
          tenantId,
          deletedAt: null,
        },
        select: {
          id: true,
          status: true,
          name: true,
        },
      });

      if (!template) {
        throw new BadRequestException('Phishing template not found for tenant');
      }
    }

    const effectiveStatus = dto.status ?? simulation.status;

    if (['scheduled', 'active'].includes(effectiveStatus)) {
      if (!mailDomain) {
        throw new BadRequestException('A verified simulation_sender mail domain is required for scheduled or active simulations');
      }

      if (mailDomain.status !== 'verified') {
        throw new BadRequestException('Mail domain must be verified before using scheduled or active status');
      }

      if (!template) {
        throw new BadRequestException('A phishing template is required for scheduled or active simulations');
      }

      if (template.status === 'archived') {
        throw new BadRequestException('Archived phishing templates cannot be used for scheduled or active simulations');
      }
    }

    const updated = await this.prisma.phishingSimulation.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.scheduledAt !== undefined
          ? { scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null }
          : {}),
        ...(dto.mailDomainId !== undefined ? { mailDomainId: dto.mailDomainId } : {}),
        ...(dto.templateId !== undefined ? { templateId: dto.templateId } : {}),
      },
      include: {
        mailDomain: {
          select: {
            id: true,
            domain: true,
            status: true,
            type: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            status: true,
            subject: true,
          },
        },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: currentUser.sub ?? currentUser.id,
        action: 'phishing_simulations.update',
        entityType: 'phishing_simulation',
        entityId: updated.id,
        metadata: {
          ...dto,
          effectiveMailDomainId,
          effectiveTemplateId,
          effectiveStatus,
        },
      },
    });

    return updated;
  }

  async archiveSimulation(tenantId: string, id: string, currentUser: any) {
    const simulation = await this.prisma.phishingSimulation.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!simulation) {
      throw new NotFoundException('Phishing simulation not found');
    }

    const archived = await this.prisma.phishingSimulation.update({
      where: { id },
      data: {
        status: 'archived',
        deletedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: currentUser.sub ?? currentUser.id,
        action: 'phishing_simulations.archive',
        entityType: 'phishing_simulation',
        entityId: archived.id,
        metadata: {
          previousStatus: simulation.status,
        },
      },
    });

    return archived;
  }

  async assignRecipients(
    tenantId: string,
    simulationId: string,
    currentUser: any,
    dto: AssignPhishingRecipientsDto,
  ) {
    const simulation = await this.prisma.phishingSimulation.findFirst({
      where: {
        id: simulationId,
        tenantId,
      },
    });

    if (!simulation) {
      throw new NotFoundException('Phishing simulation not found');
    }

    const users = await this.prisma.user.findMany({
      where: {
        tenantId,
        id: { in: dto.userIds },
      },
      select: {
        id: true,
      },
    });

    const foundUserIds = new Set(users.map((u) => u.id))
    const missingUserIds = dto.userIds.filter((id) => !foundUserIds.has(id));

    if (missingUserIds.length > 0) {
      throw new BadRequestException(`Users not found in tenant: ${missingUserIds.join(', ')}`);
    }

    const tenantAdminRole = await this.prisma.role.findFirst({
      where: {
        tenantId,
        name: 'tenant_admin',
      },
      select: {
        id: true,
      },
    });

    let excludedUserIds: string[] = [];
    let eligibleUserIds = [...dto.userIds];

    if (tenantAdminRole) {
    const adminAssignments = await this.prisma.userRole.findMany({
      where: {
        roleId: tenantAdminRole.id,
        userId: { in: dto.userIds },
      },
        select: {
          userId: true,
        },
      });

      excludedUserIds = adminAssignments.map((x) => x.userId);
      const excludedSet = new Set(excludedUserIds);
      eligibleUserIds = dto.userIds.filter((id) => !excludedSet.has(id));
    }

    const created: any[] = [];

    for (const userId of eligibleUserIds) {
      const exists = await this.prisma.phishingSimulationRecipient.findFirst({
        where: {
          tenantId,
          simulationId,
          userId,
        },
        select: { id: true, deletedAt: true },
      });

      if (exists && !exists.deletedAt) {
        continue;
      }

      const item = exists
        ? await this.prisma.phishingSimulationRecipient.update({
            where: { id: exists.id },
            data: {
              status: 'pending',
              assignedAt: new Date(),
              sentAt: null,
              openedAt: null,
              clickedAt: null,
              submittedAt: null,
              reportedAt: null,
            },
          })
        : await this.prisma.phishingSimulationRecipient.create({
            data: {
              tenantId,
              simulationId,
              userId,
              status: 'pending',
            },
          });

      created.push(item);
    }

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: currentUser.sub ?? currentUser.id,
        action: 'phishing_simulations.assign_recipients',
        entityType: 'phishing_simulation',
        entityId: simulationId,
        metadata: {
          requestedUserIds: dto.userIds,
          excludedTenantAdminUserIds: excludedUserIds,
          assignedCount: created.length,
        },
      },
    });

    return {
      simulationId,
      assignedCount: created.length,
      excludedTenantAdminUserIds: excludedUserIds,
      items: created,
    };
  }

  async listRecipients(tenantId: string, simulationId: string) {
    const simulation = await this.prisma.phishingSimulation.findFirst({
      where: {
        id: simulationId,
        tenantId,
      },
      select: { id: true },
    });

    if (!simulation) {
      throw new NotFoundException('Phishing simulation not found');
    }

    const items = await this.prisma.phishingSimulationRecipient.findMany({
      where: {
        tenantId,
        simulationId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            isActive: true,
          },
        },
      },
      orderBy: [{ assignedAt: 'desc' }],
    });

    return { items };
  }

  async getRecipientMetrics(tenantId: string, simulationId: string) {
    const simulation = await this.prisma.phishingSimulation.findFirst({
      where: {
        id: simulationId,
        tenantId,
      },
      select: { id: true },
    });

    if (!simulation) {
      throw new NotFoundException('Phishing simulation not found');
    }

    const [total, pending, sent, opened, clicked, submitted, reported] = await Promise.all([
      this.prisma.phishingSimulationRecipient.count({
        where: { tenantId, simulationId, deletedAt: null },
      }),
      this.prisma.phishingSimulationRecipient.count({
        where: { tenantId, simulationId, deletedAt: null, status: 'pending' },
      }),
      this.prisma.phishingSimulationRecipient.count({
        where: { tenantId, simulationId, deletedAt: null, status: 'sent' },
      }),
      this.prisma.phishingSimulationRecipient.count({
        where: { tenantId, simulationId, deletedAt: null, status: 'opened' },
      }),
      this.prisma.phishingSimulationRecipient.count({
        where: { tenantId, simulationId, deletedAt: null, status: 'clicked' },
      }),
      this.prisma.phishingSimulationRecipient.count({
        where: { tenantId, simulationId, deletedAt: null, status: 'submitted' },
      }),
      this.prisma.phishingSimulationRecipient.count({
        where: { tenantId, simulationId, deletedAt: null, status: 'reported' },
      }),
    ]);

    return {
      total,
      pending,
      sent,
      opened,
      clicked,
      submitted,
      reported,
    };
  }

  async updateRecipientStatus(
    tenantId: string,
    recipientId: string,
    currentUser: any,
    dto: UpdatePhishingRecipientStatusDto,
  ) {
    const recipient = await this.prisma.phishingSimulationRecipient.findFirst({
      where: {
        id: recipientId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!recipient) {
      throw new NotFoundException('Phishing recipient not found');
    }

    const updated = await this.prisma.phishingSimulationRecipient.update({
      where: { id: recipientId },
      data: {
        status: dto.status,
        ...this.mapStatusTimestamp(dto.status),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            isActive: true,
          },
        },
      },
    });

    await this.prisma.phishingSimulationEvent.create({
      data: {
        tenantId,
        simulationId: updated.simulationId,
        recipientId: updated.id,
        userId: updated.userId,
        eventType: dto.status,
        eventAt: new Date(),
        source: 'admin_manual',
        metadata: {
          triggeredByUserId: currentUser.sub ?? currentUser.id,
        },
      },
    });

    let recalculatedRisk: any = null;
    const shouldRecalculateRisk = ['clicked', 'submitted', 'reported'].includes(dto.status);

    if (shouldRecalculateRisk) {
      recalculatedRisk = await this.riskScoringService.recalculateUserRisk(
        tenantId,
        updated.userId,
        currentUser.sub ?? currentUser.id,
      );
    }

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: currentUser.sub ?? currentUser.id,
        action: 'phishing_simulations.update_recipient_status',
        entityType: 'phishing_simulation_recipient',
        entityId: updated.id,
        metadata: {
          simulationId: updated.simulationId,
          targetUserId: updated.userId,
          status: updated.status,
          shouldRecalculateRisk,
          recalculatedRiskScore: recalculatedRisk?.score ?? null,
          recalculatedRiskLevel: recalculatedRisk?.level ?? null,
        },
      },
    });

    return {
      ...updated,
      recalculatedRisk,
    };
  }

  async unassignRecipient(tenantId: string, recipientId: string, currentUser: any) {
    const recipient = await this.prisma.phishingSimulationRecipient.findFirst({
      where: {
        id: recipientId,
        tenantId,
      },
    });

    if (!recipient) {
      throw new NotFoundException('Phishing recipient not found');
    }

    const updated = await this.prisma.phishingSimulationRecipient.update({
      where: { id: recipientId },
      data: {
        deletedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: currentUser.sub ?? currentUser.id,
        action: 'phishing_simulations.unassign_recipient',
        entityType: 'phishing_simulation_recipient',
        entityId: updated.id,
        metadata: {
          simulationId: updated.simulationId,
          userId: updated.userId,
        },
      },
    });

    return updated;
  }

  async getSummary(tenantId: string) {
    const [total, draft, scheduled, active, completed, archived] = await Promise.all([
      this.prisma.phishingSimulation.count({
        where: { tenantId, deletedAt: null },
      }),
      this.prisma.phishingSimulation.count({
        where: { tenantId, deletedAt: null, status: 'draft' },
      }),
      this.prisma.phishingSimulation.count({
        where: { tenantId, deletedAt: null, status: 'scheduled' },
      }),
      this.prisma.phishingSimulation.count({
        where: { tenantId, deletedAt: null, status: 'active' },
      }),
      this.prisma.phishingSimulation.count({
        where: { tenantId, deletedAt: null, status: 'completed' },
      }),
      this.prisma.phishingSimulation.count({
        where: { tenantId, deletedAt: null, status: 'archived' },
      }),
    ]);

    return {
      total,
      draft,
      scheduled,
      active,
      completed,
      archived,
    };
  }
}
