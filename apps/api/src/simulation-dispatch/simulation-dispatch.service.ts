import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailProviderService } from '../mail-provider/mail-provider.service';

@Injectable()
export class SimulationDispatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailProviderService: MailProviderService,
  ) {}

  async dispatchSimulation(tenantId: string, simulationId: string, currentUser: any, options?: any) {
    const force = Boolean(options?.force);

    const simulation = await this.prisma.phishingSimulation.findFirst({
      where: {
        id: simulationId,
        tenantId,
        deletedAt: null,
      },
      include: {
        mailDomain: true,
        template: true,
      },
    });

    if (!simulation) {
      throw new NotFoundException('Phishing simulation not found');
    }

    if (!['scheduled', 'active'].includes(simulation.status)) {
      throw new BadRequestException('Only scheduled or active simulations can be dispatched');
    }

    if (!simulation.mailDomainId || !simulation.mailDomain || simulation.mailDomain.status !== 'verified') {
      throw new BadRequestException('Simulation requires a verified simulation_sender mail domain');
    }

    if (!simulation.templateId || !simulation.template || simulation.template.status === 'archived') {
      throw new BadRequestException('Simulation requires a valid phishing template');
    }

    const recipients = await this.prisma.phishingSimulationRecipient.findMany({
      where: {
        tenantId,
        simulationId,
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
      orderBy: [{ assignedAt: 'asc' }],
    });

    if (recipients.length === 0) {
      throw new BadRequestException('Simulation has no active recipients');
    }

    const results: any[] = [];
    let sentCount = 0;
    let skippedAlreadySentCount = 0;
    let skippedMissingEmailCount = 0;
    let skippedSuppressedCount = 0;

    for (const recipient of recipients) {
      if (!recipient.user?.email) {
        skippedMissingEmailCount += 1;
        results.push({
          recipientId: recipient.id,
          userId: recipient.userId,
          status: 'skipped',
          reason: 'missing_email',
        });
        continue;
      }

      const normalizedEmail = recipient.user.email.trim().toLowerCase();

      const suppression = await this.prisma.mailSuppression.findFirst({
        where: {
          tenantId,
          email: normalizedEmail,
          scope: { in: ['all', 'simulation'] },
        },
        orderBy: [{ createdAt: 'desc' }],
      });

      if (suppression) {
        skippedSuppressedCount += 1;
        results.push({
          recipientId: recipient.id,
          userId: recipient.userId,
          email: recipient.user.email,
          status: 'skipped',
          reason: 'suppressed',
          suppressionReason: suppression.reason,
          suppressionScope: suppression.scope,
        });
        continue;
      }

      if (!force && recipient.status === 'sent') {
        skippedAlreadySentCount += 1;
        results.push({
          recipientId: recipient.id,
          userId: recipient.userId,
          email: recipient.user.email,
          status: 'skipped',
          reason: 'already_sent',
        });
        continue;
      }

      const queuedEvent = await this.prisma.outboundMailEvent.create({
        data: {
          tenantId,
          simulationId,
          recipientId: recipient.id,
          userId: recipient.userId,
          provider: simulation.mailDomain.provider ?? 'mock_smtp',
          eventType: 'queued',
          eventAt: new Date(),
          metadata: {
            source: 'simulation_dispatch',
            dispatchedByUserId: currentUser.sub ?? currentUser.id,
            force,
          },
        },
      });

      const sendResult = await this.mailProviderService.sendMail({
        tenantId,
        simulationId,
        recipientId: recipient.id,
        toEmail: recipient.user.email,
        toName: recipient.user.fullName,
        subject: simulation.template.subject,
        htmlBody: simulation.template.htmlBody,
        fromEmail: simulation.mailDomain.fromEmail,
        fromName: simulation.mailDomain.fromName,
        replyTo: simulation.mailDomain.replyTo,
      });

      const sentEvent = await this.prisma.outboundMailEvent.create({
        data: {
          tenantId,
          simulationId,
          recipientId: recipient.id,
          userId: recipient.userId,
          provider: sendResult.provider,
          providerMessageId: sendResult.providerMessageId,
          eventType: 'sent',
          eventAt: new Date(),
          metadata: {
            source: 'simulation_dispatch',
            queuedEventId: queuedEvent.id,
            accepted: sendResult.accepted,
            force,
          },
        },
      });

      await this.prisma.phishingSimulationRecipient.update({
        where: { id: recipient.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });

      sentCount += 1;
      results.push({
        recipientId: recipient.id,
        userId: recipient.userId,
        email: recipient.user.email,
        queuedEventId: queuedEvent.id,
        sentEventId: sentEvent.id,
        provider: sendResult.provider,
        providerMessageId: sendResult.providerMessageId,
        status: 'sent',
      });
    }

    if (sentCount > 0 && simulation.status === 'scheduled') {
      await this.prisma.phishingSimulation.update({
        where: { id: simulation.id },
        data: {
          status: 'active',
        },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: currentUser.sub ?? currentUser.id,
        action: 'phishing_simulations.dispatch',
        entityType: 'phishing_simulation',
        entityId: simulationId,
        metadata: {
          simulationStatusBeforeDispatch: simulation.status,
          simulationStatusAfterDispatch:
            sentCount > 0 && simulation.status === 'scheduled' ? 'active' : simulation.status,
          mailDomainId: simulation.mailDomainId,
          templateId: simulation.templateId,
          force,
          recipientsProcessed: results.length,
          sentCount,
          skippedAlreadySentCount,
          skippedMissingEmailCount,
          skippedSuppressedCount,
        },
      },
    });

    return {
      simulationId,
      force,
      processed: results.length,
      sentCount,
      skippedAlreadySentCount,
      skippedMissingEmailCount,
      skippedSuppressedCount,
      results,
    };
  }
}
