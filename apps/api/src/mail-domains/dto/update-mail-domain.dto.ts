import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMailDomainDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  provider?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fromEmail?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  fromName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  replyTo?: string | null;

  @IsOptional()
  @IsIn(['draft', 'pending_dns', 'verified', 'failed', 'disabled'])
  status?: string;
}
