import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  fullName!: string;

  @IsString()
  @MinLength(14)
  @MaxLength(128)
  temporaryPassword!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
