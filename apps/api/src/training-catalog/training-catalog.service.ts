import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTrainingCourseDto } from './dto/create-training-course.dto';
import { UpdateTrainingCourseDto } from './dto/update-training-course.dto';
import { ListTrainingCoursesDto } from './dto/list-training-courses.dto';

@Injectable()
export class TrainingCatalogService {
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

  private normalizeText(value?: string | null) {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const v = value.trim().replace(/\s+/g, ' ');
    return v.length ? v : null;
  }

  async listCourses(
    currentUser: any,
    query?: ListTrainingCoursesDto,
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

    if (query?.status) where.status = query.status;
    if (query?.category?.trim()) where.category = query.category.trim();

    if (query?.q?.trim()) {
      where.OR = [
        { title: { contains: query.q.trim(), mode: 'insensitive' } },
        { description: { contains: query.q.trim(), mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.trainingCourse.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          tenantId: true,
          title: true,
          description: true,
          category: true,
          status: true,
          estimatedMinutes: true,
          contentUrl: true,
          createdById: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      }),
      this.prisma.trainingCourse.count({ where }),
    ])

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'training_catalog.list',
      entityType: 'TrainingCourse',
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        page,
        limit,
        total,
        q: query?.q ?? null,
        category: query?.category ?? null,
        status: query?.status ?? null,
        includeArchived,
      },
    })

    return { page, limit, total, items }
  }

  async getCourseById(currentUser: any, id: string, meta?: { ipAddress?: string; userAgent?: string }) {
    const tenantId = currentUser.tenantId

    const item = await this.prisma.trainingCourse.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        tenantId: true,
        title: true,
        description: true,
        category: true,
        status: true,
        estimatedMinutes: true,
        contentUrl: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    })

    if (!item) {
      throw new NotFoundException('Curso no encontrado')
    }

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'training_catalog.get',
      entityType: 'TrainingCourse',
      entityId: item.id,
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        title: item.title,
        status: item.status,
      },
    })

    return item
  }

  async createCourse(
    currentUser: any,
    dto: CreateTrainingCourseDto,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const tenantId = currentUser.tenantId
    const title = this.normalizeText(dto.title)

    const existing = await this.prisma.trainingCourse.findFirst({
      where: {
        tenantId,
        title: title ?? '',
        deletedAt: null,
      },
      select: { id: true },
    })

    if (existing) {
      throw new ConflictException('Ya existe un curso activo con ese título')
    }

    const created = await this.prisma.trainingCourse.create({
      data: {
        tenantId,
        title: title ?? '',
        description: this.normalizeText(dto.description),
        category: this.normalizeText(dto.category),
        status: 'draft',
        estimatedMinutes: dto.estimatedMinutes ?? null,
        contentUrl: this.normalizeText(dto.contentUrl),
        createdById: currentUser.sub,
      },
      select: {
        id: true,
        tenantId: true,
        title: true,
        description: true,
        category: true,
        status: true,
        estimatedMinutes: true,
        contentUrl: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    })

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'training_catalog.create',
      entityType: 'TrainingCourse',
      entityId: created.id,
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        title: created.title,
        status: created.status,
        category: created.category,
      },
    })

    return created
  }

  async updateCourse(
    currentUser: any,
    id: string,
    dto: UpdateTrainingCourseDto,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const tenantId = currentUser.tenantId

    const existing = await this.prisma.trainingCourse.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
      },
    })

    if (!existing) {
      throw new NotFoundException('Curso no encontrado')
    }

    const newTitle = dto.title === undefined ? existing.title : (this.normalizeText(dto.title) ?? '')

    if (newTitle !== existing.title) {
      const duplicate = await this.prisma.trainingCourse.findFirst({
        where: {
          tenantId,
          title: newTitle,
          deletedAt: null,
          id: { not: id },
        },
        select: { id: true },
      })

      if (duplicate) {
        throw new ConflictException('Ya existe un curso activo con ese título')
      }
    }

    const updated = await this.prisma.trainingCourse.update({
      where: { id },
      data: {
        title: newTitle,
        description: dto.description === undefined ? undefined : this.normalizeText(dto.description),
        category: dto.category === undefined ? undefined : this.normalizeText(dto.category),
        status: dto.status,
        estimatedMinutes: dto.estimatedMinutes,
        contentUrl: dto.contentUrl === undefined ? undefined : this.normalizeText(dto.contentUrl),
      },
      select: {
        id: true,
        tenantId: true,
        title: true,
        description: true,
        category: true,
        status: true,
        estimatedMinutes: true,
        contentUrl: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    })

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'training_catalog.update',
      entityType: 'TrainingCourse',
      entityId: updated.id,
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        previousTitle: existing.title,
        newTitle: updated.title,
        previousStatus: existing.status,
        newStatus: updated.status,
      },
    })

    return updated
  }

  async archiveCourse(currentUser: any, id: string, meta?: { ipAddress?: string; userAgent?: string }) {
    const tenantId = currentUser.tenantId

    const existing = await this.prisma.trainingCourse.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        status: true,
      },
    })

    if (!existing) {
      throw new NotFoundException('Curso no encontrado')
    }

    const archived = await this.prisma.trainingCourse.update({
      where: { id },
      data: {
        status: 'archived',
        deletedAt: new Date(),
      },
      select: {
        id: true,
        tenantId: true,
        title: true,
        description: true,
        category: true,
        status: true,
        estimatedMinutes: true,
        contentUrl: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    })

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'training_catalog.archive',
      entityType: 'TrainingCourse',
      entityId: archived.id,
      severity: 'WARN',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        title: archived.title,
        previousStatus: existing.status,
        newStatus: archived.status,
      },
    })

    return archived
  }

  async getMetrics(currentUser: any, meta?: { ipAddress?: string; userAgent?: string }) {
    const tenantId = currentUser.tenantId

    const [total, draft, published, archived] = await this.prisma.$transaction([
      this.prisma.trainingCourse.count({ where: { tenantId } }),
      this.prisma.trainingCourse.count({ where: { tenantId, status: 'draft', deletedAt: null } }),
      this.prisma.trainingCourse.count({ where: { tenantId, status: 'published', deletedAt: null } }),
      this.prisma.trainingCourse.count({ where: { tenantId, status: 'archived' } }),
    ])

    const result = { total, draft, published, archived }

    await this.writeAudit({
      tenantId,
      userId: currentUser.sub,
      action: 'training_catalog.metrics',
      entityType: 'TrainingCourse',
      severity: 'INFO',
      status: 'SUCCESS',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: result,
    })

    return result
  }
}
