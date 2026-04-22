import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePhishingSimulationDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsIn(['draft', 'scheduled', 'active', 'completed', 'archived'])
  status?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string | null;

  @IsOptional()
  @IsString()
  mailDomainId?: string | null;

  @IsOptional()
  @IsString()
  templateId?: string | null;
}
