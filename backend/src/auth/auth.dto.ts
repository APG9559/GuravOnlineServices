import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(6)
  password: string;
}
