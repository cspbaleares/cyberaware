import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePhishingTemplateDto } from './dto/create-phishing-template.dto';
import { UpdatePhishingTemplateDto } from './dto/update-phishing-template.dto';

@Injectable()
export class PhishingTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async listTemplates(tenantId: string, query: any) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const pageSize = Math.min(Math.max(Number(query.pageSize ?? 10), 1), 100);
    const skip = (page - 1) * pageSize;

    const where: any = {
      tenantId,
      deletedAt: null,
    };

    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { subject: { contains: query.search, mode: 'insensitive' } },
        { htmlBody: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.phishingTemplate.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ createdAt: 'desc' }],
      }),
      this.prisma.phishingTemplate.count({ where }),
    ]);

    return { items, page, pageSize, total };
  }

  async getTemplate(tenantId: string, id: string) {
    const item = await this.prisma.phishingTemplate.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!item) {
      throw new NotFoundException('Phishing template not found');
    }

    return item;
  }

  async createTemplate(tenantId: string, currentUser: any, dto: CreatePhishingTemplateDto) {
    const exists = await this.prisma.phishingTemplate.findFirst({
      where: {
        tenantId,
        name: dto.name,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (exists) {
      throw new BadRequestException('An active phishing template with this name already exists');
    }

    const item = await this.prisma.phishingTemplate.create({
      data: {
        tenantId,
        name: dto.name,
        subject: dto.subject,
        senderName: dto.senderName ?? null,
        senderEmail: dto.senderEmail ?? null,
        landingUrl: dto.landingUrl ?? null,
        htmlBody: dto.htmlBody,
        status: dto.status ?? 'draft',
        createdById: currentUser.sub ?? currentUser.id,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: currentUser.sub ?? currentUser.id,
        action: 'phishing_templates.create',
        entityType: 'phishing_template',
        entityId: item.id,
        metadata: {
          name: item.name,
          status: item.status,
        },
      },
    });

    return item;
  }

  async updateTemplate(tenantId: string, id: string, currentUser: any, dto: UpdatePhishingTemplateDto) {
    const current = await this.prisma.phishingTemplate.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!current) {
      throw new NotFoundException('Phishing template not found');
    }

    if (dto.name && dto.name !== current.name) {
      const exists = await this.prisma.phishingTemplate.findFirst({
        where: {
          tenantId,
          name: dto.name,
          deletedAt: null,
          NOT: { id },
        },
        select: { id: true },
      });

      if (exists) {
        throw new BadRequestException('An active phishing template with this name already exists');
      }
    }

    const item = await this.prisma.phishingTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.subject !== undefined ? { subject: dto.subject } : {}),
        ...(dto.senderName !== undefined ? { senderName: dto.senderName } : {}),
        ...(dto.senderEmail !== undefined ? { senderEmail: dto.senderEmail } : {}),
        ...(dto.landingUrl !== undefined ? { landingUrl: dto.landingUrl } : {}),
        ...(dto.htmlBody !== undefined ? { htmlBody: dto.htmlBody } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: currentUser.sub ?? currentUser.id,
        action: 'phishing_templates.update',
        entityType: 'phishing_template',
        entityId: item.id,
        metadata: { ...dto },
      },
    });

    return item;
  }

  async archiveTemplate(tenantId: string, id: string, currentUser: any) {
    const current = await this.prisma.phishingTemplate.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!current) {
      throw new NotFoundException('Phishing template not found');
    }

    const item = await this.prisma.phishingTemplate.update({
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
        action: 'phishing_templates.archive',
        entityType: 'phishing_template',
        entityId: item.id,
        metadata: {
          previousStatus: current.status,
        },
      },
    });

    return item;
  }

  async summary(tenantId: string) {
    const [total, draft, published, archived] = await Promise.all([
      this.prisma.phishingTemplate.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.phishingTemplate.count({ where: { tenantId, deletedAt: null, status: 'draft' } }),
      this.prisma.phishingTemplate.count({ where: { tenantId, deletedAt: null, status: 'published' } }),
      this.prisma.phishingTemplate.count({ where: { tenantId, deletedAt: null, status: 'archived' } }),
    ]);

    return { total, draft, published, archived };
  }
}
