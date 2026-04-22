import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMailSuppressionDto } from './dto/create-mail-suppression.dto';

@Injectable()
export class MailSuppressionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, query: any) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const pageSize = Math.min(Math.max(Number(query.pageSize ?? 10), 1), 100);
    const skip = (page - 1) * pageSize;

    const where: any = { tenantId };

    if (query.reason) where.reason = query.reason;
    if (query.scope) where.scope = query.scope;
    if (query.search) where.email = { contains: query.search, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      this.prisma.mailSuppression.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ createdAt: 'desc' }],
      }),
      this.prisma.mailSuppression.count({ where }),
    ]);

    return { items, page, pageSize, total };
  }

  async create(tenantId: string, currentUser: any, dto: CreateMailSuppressionDto) {
    const email = dto.email.trim().toLowerCase();
    const reason = dto.reason as any;
    const scope = dto.scope as any;
    const actorUserId =
      currentUser?.sub ??
      (currentUser?.id && currentUser.id !== 'provider-webhook' ? currentUser.id : null);

    const existing = await this.prisma.mailSuppression.findFirst({
      where: {
        tenantId,
        email,
        scope,
      },
    });

    if (existing) {
      return existing;
    }

    const item = await this.prisma.mailSuppression.create({
      data: {
        tenantId,
        email,
        reason,
        scope,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: actorUserId,
        action: 'mail_suppressions.create',
        entityType: 'mail_suppression',
        entityId: item.id,
        metadata: {
          email: item.email,
          reason: item.reason,
          scope: item.scope,
          actorType: actorUserId ? 'user' : 'system',
        },
      },
    });

    return item;
  }

  async remove(tenantId: string, id: string, currentUser: any) {
    const current = await this.prisma.mailSuppression.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!current) {
      throw new NotFoundException('Mail suppression not found');
    }

    await this.prisma.mailSuppression.delete({
      where: { id },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: currentUser.sub ?? currentUser.id,
        action: 'mail_suppressions.delete',
        entityType: 'mail_suppression',
        entityId: id,
        metadata: {
          email: current.email,
          reason: current.reason,
          scope: current.scope,
        },
      },
    });

    return { success: true, id };
  }

  async summary(tenantId: string) {
    const [total, bounce, complaint, manualOptout] = await Promise.all([
      this.prisma.mailSuppression.count({ where: { tenantId } }),
      this.prisma.mailSuppression.count({ where: { tenantId, reason: 'bounce' as any } }),
      this.prisma.mailSuppression.count({ where: { tenantId, reason: 'complaint' as any } }),
      this.prisma.mailSuppression.count({ where: { tenantId, reason: 'manual_optout' as any } }),
    ]);

    return {
      total,
      bounce,
      complaint,
      manualOptout,
    };
  }
}
