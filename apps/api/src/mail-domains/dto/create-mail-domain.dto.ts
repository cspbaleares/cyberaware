import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMailDomainDto {
  @IsString()
  @MaxLength(255)
  domain!: string;

  @IsIn(['simulation_sender', 'tracking', 'bounce'])
  type!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  provider?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fromEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  fromName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  replyTo?: string;
}
