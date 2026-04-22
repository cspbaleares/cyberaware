import { IsIn, IsString, MaxLength } from 'class-validator';

export class CreateMailSuppressionDto {
  @IsString()
  @MaxLength(255)
  email!: string;

  @IsIn(['bounce', 'complaint', 'manual_optout'])
  reason!: string;

  @IsIn(['simulation', 'all'])
  scope!: string;
}
