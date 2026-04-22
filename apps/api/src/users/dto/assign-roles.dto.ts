import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from 'class-validator';

export class AssignRolesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  roleNames!: string[];
}
