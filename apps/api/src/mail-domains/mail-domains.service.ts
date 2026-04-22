import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMailDomainDto } from './dto/create-mail-domain.dto';
import { UpdateMailDomainDto } from './dto/update-mail-domain.dto';

@Injectable()
export class MailDomainsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildExpectedRecords(domain: string, type: string) {
    const base = domain.trim().toLowerCase();

    return {
      spfExpected: type === 'simulation_sender' ? `v=spf1 include:mail.example-provider.invalid ~all` : null,
      dkimExpected: type === 'simulation_sender' ? `selector1._domainkey.${base} TXT k=rsa; p=REPLACE_WITH_PROVIDER_KEY` : null,
      dmarcExpected: `_dmarc.${base} TXT v=DMARC1; p=none; rua=mailto:dmarc@${base}`,
      bounceExpected: type === 'bounce' ? `bounce.${base} CNAME provider-bounce.example.invalid` : null,
      trackingExpected: type === 'tracking' ? `${base} CNAME provider-tracking.example.invalid` : null,
    };
  }

  async list(tenantId: string, query: any) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const pageSize = Math.min(Math.max(Number(query.pageSize ?? 10), 1), 100);
    const skip = (page - 1) * pageSize;

    const where: any = {
      tenantId,
      deletedAt: null,
    };

    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { domain: { contains: query.search, mode: 'insensitive' } },
        { fromEmail: { contains: query.search, mode: 'insensitive' } },
        { fromName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.tenantMailDomain.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ createdAt: 'desc' }],
      }),
      this.prisma.tenantMailDomain.count({ where }),
    ]);

    return { items, page, pageSize, total };
  }

  async getById(tenantId: string, id: string) {
    const item = await this.prisma.tenantMailDomain.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!item) {
      throw new NotFoundException('Mail domain not found');
    }

    return item;
  }

  async create(tenantId: string, currentUser: any, dto: CreateMailDomainDto) {
    const domain = dto.domain.trim().toLowerCase();

    const exists = await this.prisma.tenantMailDomain.findFirst({
      where: {
        tenantId,
        domain,
        type: dto.type,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (exists) {
      throw new BadRequestException('An active mail domain with this domain and type already exists');
    }

    const expected = this.buildExpectedRecords(domain, dto.type);

    const item = await this.prisma.tenantMailDomain.create({
      data: {
        tenantId,
        domain,
        type: dto.type,
        provider: dto.provider ?? null,
        fromEmail: dto.fromEmail ?? null,
        fromName: dto.fromName ?? null,
        replyTo: dto.replyTo ?? null,
        status: 'pending_dns',
        createdById: currentUser.sub ?? currentUser.id,
        ...expected,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: currentUser.sub ?? currentUser.id,
        action: 'mail_domains.create',
        entityType: 'tenant_mail_domain',
        entityId: item.id,
        metadata: {
          domain: item.domain,
          type: item.type,
          status: item.status,
        },
      },
    });

    return item;
  }

  async update(tenantId: string, id: string, currentUser: any, dto: UpdateMailDomainDto) {
    const current = await this.prisma.tenantMailDomain.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!current) {
      throw new NotFoundException('Mail domain not found');
    }

    const item = await this.prisma.tenantMailDomain.update({
      where: { id },
      data: {
        ...(dto.provider !== undefined ? { provider: dto.provider } : {}),
        ...(dto.fromEmail !== undefined ? { fromEmail: dto.fromEmail } : {}),
        ...(dto.fromName !== undefined ? { fromName: dto.fromName } : {}),
        ...(dto.replyTo !== undefined ? { replyTo: dto.replyTo } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: currentUser.sub ?? currentUser.id,
        action: 'mail_domains.update',
        entityType: 'tenant_mail_domain',
        entityId: item.id,
        metadata: { ...dto },
      },
    });

    return item;
  }

  async verify(tenantId: string, id: string, currentUser: any) {
    const current = await this.prisma.tenantMailDomain.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!current) {
      throw new NotFoundException('Mail domain not found');
    }

    const item = await this.prisma.tenantMailDomain.update({
      where: { id },
      data: {
        status: 'verified',
        spfStatus: current.type === 'simulation_sender' ? 'verified' : current.spfStatus,
        dkimStatus: current.type === 'simulation_sender' ? 'verified' : current.dkimStatus,
        dmarcStatus: 'verified',
        bounceStatus: current.type === 'bounce' ? 'verified' : current.bounceStatus,
        trackingStatus: current.type === 'tracking' ? 'verified' : current.trackingStatus,
        lastCheckedAt: new Date(),
        verificationMetadata: {
          mode: 'manual',
          checkedByUserId: currentUser.sub ?? currentUser.id,
        },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: currentUser.sub ?? currentUser.id,
        action: 'mail_domains.verify',
        entityType: 'tenant_mail_domain',
        entityId: item.id,
        metadata: {
          domain: item.domain,
          type: item.type,
          status: item.status,
        },
      },
    });

    return item;
  }

  async disable(tenantId: string, id: string, currentUser: any) {
    const current = await this.prisma.tenantMailDomain.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!current) {
      throw new NotFoundException('Mail domain not found');
    }

    const item = await this.prisma.tenantMailDomain.update({
      where: { id },
      data: {
        status: 'disabled',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: currentUser.sub ?? currentUser.id,
        action: 'mail_domains.disable',
        entityType: 'tenant_mail_domain',
        entityId: item.id,
        metadata: {
          domain: item.domain,
          type: item.type,
        },
      },
    });

    return item;
  }

  async archive(tenantId: string, id: string, currentUser: any) {
    const current = await this.prisma.tenantMailDomain.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!current) {
      throw new NotFoundException('Mail domain not found');
    }

    const item = await this.prisma.tenantMailDomain.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: currentUser.sub ?? currentUser.id,
        action: 'mail_domains.archive',
        entityType: 'tenant_mail_domain',
        entityId: item.id,
        metadata: {
          domain: item.domain,
          type: item.type,
        },
      },
    });

    return item;
  }

  async summary(tenantId: string) {
    const [total, pendingDns, verified, failed, disabled] = await Promise.all([
      this.prisma.tenantMailDomain.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.tenantMailDomain.count({ where: { tenantId, deletedAt: null, status: 'pending_dns' } }),
      this.prisma.tenantMailDomain.count({ where: { tenantId, deletedAt: null, status: 'verified' } }),
      this.prisma.tenantMailDomain.count({ where: { tenantId, deletedAt: null, status: 'failed' } }),
      this.prisma.tenantMailDomain.count({ where: { tenantId, deletedAt: null, status: 'disabled' } }),
    ]);

    return {
      total,
      pendingDns,
      verified,
      failed,
      disabled,
    };
  }
}
