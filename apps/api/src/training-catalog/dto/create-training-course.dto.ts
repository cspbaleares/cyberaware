import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateTrainingCourseDto {
  @IsString()
  @MaxLength(160)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedMinutes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  contentUrl?: string;
}
