import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

export type MailSendInput = {
  toEmail: string;
  toName?: string | null;
  subject: string;
  htmlBody: string;
  fromEmail?: string | null;
  fromName?: string | null;
  replyTo?: string | null;
  simulationId: string;
  recipientId: string;
  tenantId: string;
};

@Injectable()
export class MailProviderService {
  constructor(private readonly configService: ConfigService) {}

  private buildMockMessageId(input: MailSendInput) {
    return `sim-${input.simulationId}-rcpt-${input.recipientId}-${Date.now()}`;
  }

  private buildFromHeader(fromEmail: string, fromName?: string | null) {
    return fromName ? `"${fromName}" <${fromEmail}>` : fromEmail;
  }

  private async sendWithSmtp(input: MailSendInput) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get<string>('SMTP_PORT') ?? 587);
    const secure = String(this.configService.get<string>('SMTP_SECURE') ?? 'false') === 'true';
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host || !port || !user || !pass) {
      throw new Error('SMTP configuration is incomplete');
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    const fallbackFrom = this.configService.get<string>('SMTP_FROM_FALLBACK') ?? user;
    const fallbackReplyTo = this.configService.get<string>('SMTP_REPLY_TO_FALLBACK') ?? undefined;

    const fromEmail = input.fromEmail ?? fallbackFrom;
    const fromName = input.fromName ?? undefined;
    const replyTo = input.replyTo ?? fallbackReplyTo;

    const info = await transporter.sendMail({
      from: this.buildFromHeader(fromEmail, fromName),
      to: input.toName ? `"${input.toName}" <${input.toEmail}>` : input.toEmail,
      replyTo,
      subject: input.subject,
      html: input.htmlBody,
    });

    return {
      provider: 'smtp',
      providerMessageId: info.messageId,
      accepted: Array.isArray(info.accepted) ? info.accepted.length > 0 : true,
      envelope: info.envelope,
    };
  }

  private async sendWithMailgun(input: MailSendInput) {
    const apiKey = this.configService.get<string>('MAILGUN_API_KEY');
    const baseUrl =
      this.configService.get<string>('MAILGUN_BASE_URL') ?? 'https://api.mailgun.net';
    const domain = this.configService.get<string>('MAILGUN_DOMAIN');
    const defaultFrom = this.configService.get<string>('MAIL_FROM');
    const fallbackReplyTo = this.configService.get<string>('MAIL_REPLY_TO_FALLBACK') ?? undefined;

    if (!apiKey || !domain || !defaultFrom) {
      throw new Error('Mailgun configuration is incomplete');
    }

    const fromEmail = input.fromEmail ?? defaultFrom;
    const replyTo = input.replyTo ?? fallbackReplyTo;

    const formData = new URLSearchParams();
    formData.set('from', this.buildFromHeader(fromEmail, input.fromName));
    formData.set('to', input.toName ? `"${input.toName}" <${input.toEmail}>` : input.toEmail);
    formData.set('subject', input.subject);
    formData.set('html', input.htmlBody);

    if (replyTo) {
      formData.set('h:Reply-To', replyTo);
    }

    const authToken = Buffer.from(`api:${apiKey}`).toString('base64');
    const response = await fetch(`${baseUrl}/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const text = await response.text();

    if (!response.ok) {
      throw new Error(`Mailgun ${response.status}: ${text}`);
    }

    const result = JSON.parse(text) as { id?: string; message?: string };

    return {
      provider: 'mailgun',
      providerMessageId: result.id ?? this.buildMockMessageId(input),
      accepted: true,
      envelope: {
        toEmail: input.toEmail,
        fromEmail,
      },
      providerResponse: result.message ?? null,
    };
  }

  async sendMail(input: MailSendInput) {
    const provider = (this.configService.get<string>('MAIL_PROVIDER') ?? 'mock').toLowerCase();

    if (provider === 'smtp') {
      return this.sendWithSmtp(input);
    }

    if (provider === 'mailgun') {
      return this.sendWithMailgun(input);
    }

    const providerMessageId = this.buildMockMessageId(input);

    return {
      provider: 'mock_smtp',
      providerMessageId,
      accepted: true,
      envelope: {
        toEmail: input.toEmail,
        fromEmail: input.fromEmail ?? null,
      },
    };
  }
}
