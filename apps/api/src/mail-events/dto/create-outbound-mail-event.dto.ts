import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateOutboundMailEventDto {
  @IsString()
  recipientId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  provider?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  providerMessageId?: string;

  @IsIn(['queued', 'sent', 'delivered', 'bounced', 'complained', 'opened', 'clicked'])
  eventType!: string;
}
