import { Type } from 'class-transformer';
import { IsBooleanString, IsOptional, IsPositive } from 'class-validator';

export class ListUsersDto {
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  limit: number = 20;

  @IsOptional()
  @IsBooleanString()
  isActive?: string;
}
