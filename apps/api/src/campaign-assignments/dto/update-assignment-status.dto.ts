import { IsIn } from 'class-validator';

export class UpdateAssignmentStatusDto {
  @IsIn(['assigned', 'in_progress', 'completed'])
  status: string;
}
