import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOutboundMailEventDto } from './dto/create-outbound-mail-event.dto';
import { ProviderWebhookDto } from './dto/provider-webhook.dto';
import { MailSuppressionsService } from '../mail-suppressions/mail-suppressions.service';

@Injectable()
export class MailEventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailSuppressionsService: MailSuppressionsService,
  ) {}

  async listSimulationEvents(tenantId: string, simulationId: string) {
    const simulation = await this.prisma.phishingSimulation.findFirst({
      where: {
        id: simulationId,
        tenantId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!simulation) {
      throw new NotFoundException('Phishing simulation not found');
    }

    const items = await this.prisma.outboundMailEvent.findMany({
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
      orderBy: [{ eventAt: 'desc' }, { createdAt: 'desc' }],
    });

    return { items };
  }

  async summary(tenantId: string, simulationId: string) {
    const simulation = await this.prisma.phishingSimulation.findFirst({
      where: {
        id: simulationId,
        tenantId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!simulation) {
      throw new NotFoundException('Phishing simulation not found');
    }

    const [queued, sent, delivered, bounced, complained, opened, clicked] = await Promise.all([
      this.prisma.outboundMailEvent.count({ where: { tenantId, simulationId, eventType: 'queued' } }),
      this.prisma.outboundMailEvent.count({ where: { tenantId, simulationId, eventType: 'sent' } }),
      this.prisma.outboundMailEvent.count({ where: { tenantId, simulationId, eventType: 'delivered' } }),
      this.prisma.outboundMailEvent.count({ where: { tenantId, simulationId, eventType: 'bounced' } }),
      this.prisma.outboundMailEvent.count({ where: { tenantId, simulationId, eventType: 'complained' } }),
      this.prisma.outboundMailEvent.count({ where: { tenantId, simulationId, eventType: 'opened' } }),
      this.prisma.outboundMailEvent.count({ where: { tenantId, simulationId, eventType: 'clicked' } }),
    ]);

    return {
      queued,
      sent,
      delivered,
      bounced,
      complained,
      opened,
      clicked,
    };
  }

  async createManualEvent(tenantId: string, simulationId: string, currentUser: any, dto: CreateOutboundMailEventDto) {
    const recipient = await this.prisma.phishingSimulationRecipient.findFirst({
      where: {
        id: dto.recipientId,
        tenantId,
        simulationId,
        deletedAt: null,
      },
      select: {
        id: true,
        userId: true,
        simulationId: true,
        status: true,
      },
    });

    if (!recipient) {
      throw new NotFoundException('Phishing recipient not found');
    }

    const event = await this.prisma.outboundMailEvent.create({
      data: {
        tenantId,
        simulationId,
        recipientId: recipient.id,
        userId: recipient.userId,
        provider: dto.provider ?? null,
        providerMessageId: dto.providerMessageId ?? null,
        eventType: dto.eventType,
        eventAt: new Date(),
        metadata: {
          source: 'admin_manual',
          triggeredByUserId: currentUser.sub ?? currentUser.id,
        },
      },
    });

    if (dto.eventType === 'sent') {
      await this.prisma.phishingSimulationRecipient.update({
        where: { id: recipient.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });
    }

    if (dto.eventType === 'opened') {
      await this.prisma.phishingSimulationRecipient.update({
        where: { id: recipient.id },
        data: {
          status: 'opened',
          openedAt: new Date(),
        },
      });
    }

    if (dto.eventType === 'clicked') {
      await this.prisma.phishingSimulationRecipient.update({
        where: { id: recipient.id },
        data: {
          status: 'clicked',
          clickedAt: new Date(),
        },
      });

      await this.prisma.phishingSimulationEvent.create({
        data: {
          tenantId,
          simulationId,
          recipientId: recipient.id,
          userId: recipient.userId,
          eventType: 'clicked',
          eventAt: new Date(),
          source: 'mail_provider',
          metadata: {
            provider: dto.provider ?? null,
            providerMessageId: dto.providerMessageId ?? null,
          },
        },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: currentUser.sub ?? currentUser.id,
        action: 'outbound_mail_events.create',
        entityType: 'outbound_mail_event',
        entityId: event.id,
        metadata: {
          simulationId,
          recipientId: recipient.id,
          eventType: dto.eventType,
          provider: dto.provider ?? null,
          providerMessageId: dto.providerMessageId ?? null,
        },
      },
    });

    return event;
  }

  private parseMailgunWebhook(payload: Record<string, any>): ProviderWebhookDto {
    const eventData = payload['event-data'] ?? payload.eventData ?? payload;
    const event = String(eventData?.event ?? payload.event ?? '').trim().toLowerCase();
    const recipient = String(
      eventData?.recipient ?? payload.recipient ?? eventData?.message?.headers?.to ?? '',
    )
      .trim()
      .toLowerCase();
    const timestampValue = eventData?.timestamp ?? payload.timestamp;
    const timestamp = timestampValue
      ? new Date(Number(timestampValue) * 1000).toISOString()
      : undefined;
    const providerMessageId = String(
      eventData?.['message-id'] ??
        eventData?.message?.headers?.['message-id'] ??
        payload['message-id'] ??
        payload.messageId ??
        '',
    ).trim();

    let eventType: ProviderWebhookDto['eventType'] | null = null;

    if (event === 'delivered') {
      eventType = 'delivered';
    } else if (event === 'complained' || event === 'complaint') {
      eventType = 'complained';
    } else if (event === 'failed' || event === 'bounced' || event === 'permanent_fail') {
      eventType = 'bounced';
    }

    if (!eventType) {
      throw new BadRequestException(`Unsupported Mailgun event: ${event || 'unknown'}`);
    }

    if (!recipient) {
      throw new BadRequestException('Mailgun webhook is missing recipient');
    }

    return {
      provider: 'mailgun',
      providerMessageId: providerMessageId || undefined,
      eventType,
      email: recipient,
      timestamp,
    };
  }

  async providerWebhook(input: ProviderWebhookDto | Record<string, any>) {
    const dto =
      typeof input === 'object' && input && 'provider' in input
        ? (input as ProviderWebhookDto)
        : this.parseMailgunWebhook(input as Record<string, any>);

    const email = dto.email.trim().toLowerCase();
    const eventAt = dto.timestamp ? new Date(dto.timestamp) : new Date();

    let latestSent: any = null;

    if (dto.providerMessageId) {
      latestSent = await this.prisma.outboundMailEvent.findFirst({
        where: {
          provider: dto.provider,
          providerMessageId: dto.providerMessageId,
          eventType: 'sent',
          user: {
            email,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        orderBy: [{ eventAt: 'desc' }],
      });
    } else {
      const matches = await this.prisma.outboundMailEvent.findMany({
        where: {
          provider: dto.provider,
          eventType: 'sent',
          user: {
            email,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        orderBy: [{ eventAt: 'desc' }],
        take: 2,
      });

      if (matches.length > 1) {
        throw new BadRequestException('Ambiguous webhook event: providerMessageId is required');
      }

      latestSent = matches[0] ?? null;
    }

    if (!latestSent) {
      throw new NotFoundException('Matching sent event not found');
    }

    const created = await this.prisma.outboundMailEvent.create({
      data: {
        tenantId: latestSent.tenantId,
        simulationId: latestSent.simulationId,
        recipientId: latestSent.recipientId,
        userId: latestSent.userId,
        provider: dto.provider,
        providerMessageId: dto.providerMessageId ?? latestSent.providerMessageId,
        eventType: dto.eventType,
        eventAt,
        metadata: {
          source: 'provider_webhook',
          email,
        },
      },
    });

    if (dto.eventType === 'bounced') {
      await this.mailSuppressionsService.create(
        latestSent.tenantId,
        { id: 'provider-webhook' },
        {
          email,
          reason: 'bounce',
          scope: 'all',
        },
      );
    }

    if (dto.eventType === 'complained') {
      await this.mailSuppressionsService.create(
        latestSent.tenantId,
        { id: 'provider-webhook' },
        {
          email,
          reason: 'complaint',
          scope: 'all',
        },
      );
    }

    await this.prisma.auditLog.create({
      data: {
        tenantId: latestSent.tenantId,
        userId: null,
        action: 'outbound_mail_events.provider_webhook',
        entityType: 'outbound_mail_event',
        entityId: created.id,
        metadata: {
          provider: dto.provider,
          providerMessageId: dto.providerMessageId ?? latestSent.providerMessageId,
          eventType: dto.eventType,
          email,
        },
      },
    });

    return created;
  }
}
