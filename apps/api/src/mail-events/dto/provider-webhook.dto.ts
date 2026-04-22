import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ProviderWebhookDto {
  @IsString()
  @MaxLength(100)
  provider!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  providerMessageId?: string;

  @IsIn(['delivered', 'bounced', 'complained'])
  eventType!: string;

  @IsString()
  @MaxLength(255)
  email!: string;

  @IsOptional()
  @IsString()
  timestamp?: string;
}
