import { IsIn, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreatePhishingTemplateDto {
  @IsString()
  @MaxLength(150)
  name!: string;

  @IsString()
  @MaxLength(200)
  subject!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  senderName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  senderEmail?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(1000)
  landingUrl?: string;

  @IsString()
  htmlBody!: string;

  @IsOptional()
  @IsIn(['draft', 'published', 'archived'])
  status?: string;
}
