import { IsBoolean, IsOptional } from 'class-validator';

export class DispatchSimulationDto {
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
