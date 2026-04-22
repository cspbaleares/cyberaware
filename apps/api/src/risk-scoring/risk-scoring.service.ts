import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RiskScoringService {
  constructor(private readonly prisma: PrismaService) {}

  private classify(score: number): 'low' | 'medium' | 'high' {
    if (score <= 33) return 'low';
    if (score <= 66) return 'medium';
    return 'high';
  }

  private normalizeScore(value: number): number {
    if (value < 0) return 0;
    if (value > 100) return 100;
    return Math.round(value);
  }

  async recalculateUserRisk(tenantId: string, userId: string, actorUserId?: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [
      campaignAssignmentsTotal,
      campaignAssignmentsCompleted,
      trainingEnrollmentsTotal,
      trainingEnrollmentsCompleted,
      phishingRecipientsTotal,
      phishingReported,
      phishingClicked,
      phishingSubmitted,
    ] = await Promise.all([
      this.prisma.campaignAssignment.count({
        where: {
          tenantId,
          userId,
          deletedAt: null,
        },
      }),
      this.prisma.campaignAssignment.count({
        where: {
          tenantId,
          userId,
          deletedAt: null,
          status: 'completed',
        },
      }),
      this.prisma.trainingEnrollment.count({
        where: {
          tenantId,
          userId,
          deletedAt: null,
        },
      }),
      this.prisma.trainingEnrollment.count({
        where: {
          tenantId,
          userId,
          deletedAt: null,
          status: 'completed',
        },
      }),
      this.prisma.phishingSimulationRecipient.count({
        where: {
          tenantId,
          userId,
          deletedAt: null,
        },
      }),
      this.prisma.phishingSimulationEvent.count({
        where: {
          tenantId,
          userId,
          eventType: 'reported',
        },
      }),
      this.prisma.phishingSimulationEvent.count({
        where: {
          tenantId,
          userId,
          eventType: 'clicked',
        },
      }),
      this.prisma.phishingSimulationEvent.count({
        where: {
          tenantId,
          userId,
          eventType: 'submitted',
        },
      }),
    ]);

    const campaignRisk =
      campaignAssignmentsTotal === 0
        ? 0
        : (1 - campaignAssignmentsCompleted / campaignAssignmentsTotal) * 30;

    const trainingRisk =
      trainingEnrollmentsTotal === 0
        ? 0
        : (1 - trainingEnrollmentsCompleted / trainingEnrollmentsTotal) * 30;

    let phishingRisk = 0;

    if (phishingRecipientsTotal > 0) {
      phishingRisk += (phishingClicked / phishingRecipientsTotal) * 25;
      phishingRisk += (phishingSubmitted / phishingRecipientsTotal) * 35;
      phishingRisk -= (phishingReported / phishingRecipientsTotal) * 20;
    }

    const score = this.normalizeScore(campaignRisk + trainingRisk + phishingRisk);
    const level = this.classify(score);

    const saved = await this.prisma.riskScore.upsert({
      where: {
        tenantId_userId: {
          tenantId,
          userId,
        },
      },
      update: {
        score,
        level,
        calculatedAt: new Date(),
        deletedAt: null,
      },
      create: {
        tenantId,
        userId,
        score,
        level,
        calculatedAt: new Date(),
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

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: actorUserId ?? userId,
        action: 'risk_scoring.recalculate_user',
        entityType: 'risk_score',
        entityId: saved.id,
        metadata: {
          targetUserId: userId,
          score,
          level,
          campaignAssignmentsTotal,
          campaignAssignmentsCompleted,
          trainingEnrollmentsTotal,
          trainingEnrollmentsCompleted,
          phishingRecipientsTotal,
          phishingReported,
          phishingClicked,
          phishingSubmitted,
        },
      },
    });

    return {
      id: saved.id,
      tenantId: saved.tenantId,
      userId: saved.userId,
      score: saved.score,
      level: saved.level,
      calculatedAt: saved.calculatedAt,
      user: saved.user,
      factors: {
        campaignAssignments: {
          total: campaignAssignmentsTotal,
          completed: campaignAssignmentsCompleted,
        },
        trainingEnrollments: {
          total: trainingEnrollmentsTotal,
          completed: trainingEnrollmentsCompleted,
        },
        phishingSimulations: {
          total: phishingRecipientsTotal,
          reported: phishingReported,
          clicked: phishingClicked,
          submitted: phishingSubmitted,
        },
      },
    };
  }

  async recalculateTenantRisk(tenantId: string, actorUserId?: string) {
    const users = await this.prisma.user.findMany({
      where: {
        tenantId,
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const results: any[] = [];
    for (const user of users) {
      const recalculated = await this.recalculateUserRisk(tenantId, user.id, actorUserId);
      results.push(recalculated);
    }

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: actorUserId ?? null,
        action: 'risk_scoring.recalculate_tenant',
        entityType: 'risk_score',
        entityId: tenantId,
        metadata: {
          usersProcessed: results.length,
        },
      },
    });

    return {
      totalUsersProcessed: results.length,
      results,
    };
  }

  async listTenantRiskScores(tenantId: string) {
    const items = await this.prisma.riskScore.findMany({
      where: {
        tenantId,
        deletedAt: null,
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
      orderBy: [{ score: 'desc' }, { calculatedAt: 'desc' }],
    });

    return {
      items,
    };
  }

  async getTenantRiskSummary(tenantId: string, actorUserId?: string) {
    const [total, low, medium, high, avg] = await Promise.all([
      this.prisma.riskScore.count({
        where: { tenantId, deletedAt: null },
      }),
      this.prisma.riskScore.count({
        where: { tenantId, deletedAt: null, level: 'low' },
      }),
      this.prisma.riskScore.count({
        where: { tenantId, deletedAt: null, level: 'medium' },
      }),
      this.prisma.riskScore.count({
        where: { tenantId, deletedAt: null, level: 'high' },
      }),
      this.prisma.riskScore.aggregate({
        where: { tenantId, deletedAt: null },
        _avg: { score: true },
      }),
    ]);

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: actorUserId ?? null,
        action: 'risk_scoring.summary',
        entityType: 'risk_score',
        entityId: tenantId,
        metadata: {
          total,
          low,
          medium,
          high,
          averageScore: avg._avg.score ?? 0,
        },
      },
    });

    return {
      total,
      low,
      medium,
      high,
      averageScore: avg._avg.score ? Number(avg._avg.score.toFixed(2)) : 0,
    };
  }
}
