import { IsIn, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdatePhishingTemplateDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  senderName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  senderEmail?: string | null;

  @IsOptional()
  @IsUrl()
  @MaxLength(1000)
  landingUrl?: string | null;

  @IsOptional()
  @IsString()
  htmlBody?: string;

  @IsOptional()
  @IsIn(['draft', 'published', 'archived'])
  status?: string;
}
