import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class AssignCampaignDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  userIds: string[];
}
