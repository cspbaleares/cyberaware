import { IsIn, IsInt, Max, Min } from 'class-validator';

export class UpdateTrainingEnrollmentStatusDto {
  @IsIn(['assigned', 'in_progress', 'completed'])
  status: string;

  @IsInt()
  @Min(0)
  @Max(100)
  progressPct: number;
}
