import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class AssignTrainingDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  userIds: string[];
}
