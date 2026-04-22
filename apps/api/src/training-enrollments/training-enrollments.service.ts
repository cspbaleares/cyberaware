import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssignTrainingDto } from './dto/assign-training.dto';
import { UpdateTrainingEnrollmentStatusDto } from './dto/update-training-enrollment-status.dto';

@Injectable()
export class TrainingEnrollmentsService {
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

  private async getTrainingOrFail(tenantId: string, trainingId: string) {
    const training = await this.prisma.trainingCourse.findFirst({
      where: {
        id: trainingId,
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        tenantId: true,
        title: true,
        status: true,
      },
    });

    if (!training) {
      throw new NotFoundException('Curso no encontrado');
    }

    return training;
  }

  async assignUsers(
    currentUser: any,
    trainingId: string,
    dto: AssignTrainingDto,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const tenantId = currentUser.tenantId;
    const training = await this.getTrainingOrFail(tenantId, trainingId);

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

    const existing = await this.prisma.trainingEnrollment.findMany({
      where: {
        trainingId,
        userId: { in: userIds },
        deletedAt: null,
      },
      select: {
        userId: true,
      },
    });

    if (existing.length > 0) {
      throw new ConflictException('Uno o más usuarios ya están asignados al curso');
    }

    await this.prisma.$transaction(
      users.map((user) =>
        this.prisma.trainingEnrollment.create({
          data: {
            tenantId,
            trainingId,
            userId: user.id,
            assignedById: currentUser.sub,
            status: 'assigned',
            progressPct: 0,
          },
        }),
      ),
    );

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'training_enrollments.assign',
      entityType: 'TrainingEnrollment',
      entityId: trainingId,
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        trainingId,
        trainingTitle: training.title,
        assignedCount: users.length,
        userIds,
      },
    });

    return {
      trainingId,
      assignedCount: users.length,
      userIds,
    };
  }

  async listEnrollments(
    currentUser: any,
    trainingId: string,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const tenantId = currentUser.tenantId;
    await this.getTrainingOrFail(tenantId, trainingId);

    const items = await this.prisma.trainingEnrollment.findMany({
      where: {
        tenantId,
        trainingId,
        deletedAt: null,
      },
      orderBy: {
        assignedAt: 'desc',
      },
      select: {
        id: true,
        tenantId: true,
        trainingId: true,
        userId: true,
        assignedById: true,
        assignedAt: true,
        status: true,
        progressPct: true,
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
      action: 'training_enrollments.list',
      entityType: 'TrainingEnrollment',
      entityId: trainingId,
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        trainingId,
        total: items.length,
      },
    });

    return items;
  }

  async updateEnrollmentStatus(
    currentUser: any,
    enrollmentId: string,
    dto: UpdateTrainingEnrollmentStatusDto,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const tenantId = currentUser.tenantId;

    const existing = await this.prisma.trainingEnrollment.findFirst({
      where: {
        id: enrollmentId,
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        trainingId: true,
        userId: true,
        status: true,
        progressPct: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Matrícula no encontrada');
    }

    if (dto.status === 'completed' && dto.progressPct !== 100) {
      throw new BadRequestException('Un curso completado debe tener progressPct=100');
    }

    if (dto.status !== 'completed' && dto.progressPct === 100) {
      throw new BadRequestException('progressPct=100 requiere status=completed');
    }

    const updated = await this.prisma.trainingEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: dto.status,
        progressPct: dto.progressPct,
        completedAt: dto.status === 'completed' ? new Date() : null,
      },
      select: {
        id: true,
        tenantId: true,
        trainingId: true,
        userId: true,
        assignedById: true,
        assignedAt: true,
        status: true,
        progressPct: true,
        completedAt: true,
      },
    });

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'training_enrollments.update_status',
      entityType: 'TrainingEnrollment',
      entityId: updated.id,
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        trainingId: updated.trainingId,
        targetUserId: updated.userId,
        previousStatus: existing.status,
        newStatus: updated.status,
        previousProgressPct: existing.progressPct,
        newProgressPct: updated.progressPct,
      },
    });

    return updated;
  }

  async unenroll(
    currentUser: any,
    enrollmentId: string,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const tenantId = currentUser.tenantId;

    const existing = await this.prisma.trainingEnrollment.findFirst({
      where: {
        id: enrollmentId,
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        trainingId: true,
        userId: true,
        status: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Matrícula no encontrada');
    }

    const updated = await this.prisma.trainingEnrollment.update({
      where: { id: enrollmentId },
      data: {
        deletedAt: new Date(),
      },
      select: {
        id: true,
        tenantId: true,
        trainingId: true,
        userId: true,
        status: true,
        deletedAt: true,
      },
    });

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'training_enrollments.unenroll',
      entityType: 'TrainingEnrollment',
      entityId: updated.id,
      severity: 'WARN',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        trainingId: updated.trainingId,
        targetUserId: updated.userId,
        previousStatus: existing.status,
      },
    });

    return updated;
  }

  async getEnrollmentMetrics(
    currentUser: any,
    trainingId: string,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const tenantId = currentUser.tenantId;
    await this.getTrainingOrFail(tenantId, trainingId);

    const [total, assigned, inProgress, completed] = await this.prisma.$transaction([
      this.prisma.trainingEnrollment.count({
        where: { tenantId, trainingId, deletedAt: null },
      }),
      this.prisma.trainingEnrollment.count({
        where: { tenantId, trainingId, status: 'assigned', deletedAt: null },
      }),
      this.prisma.trainingEnrollment.count({
        where: { tenantId, trainingId, status: 'in_progress', deletedAt: null },
      }),
      this.prisma.trainingEnrollment.count({
        where: { tenantId, trainingId, status: 'completed', deletedAt: null },
      }),
    ]);

    const result = {
      trainingId,
      total,
      assigned,
      inProgress,
      completed,
    };

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'training_enrollments.metrics',
      entityType: 'TrainingEnrollment',
      entityId: trainingId,
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: result,
    });

    return result;
  }
}
