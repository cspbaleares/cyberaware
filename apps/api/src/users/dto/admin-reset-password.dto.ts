import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class AdminResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(14)
  @MaxLength(128)
  newTemporaryPassword!: string;
}
