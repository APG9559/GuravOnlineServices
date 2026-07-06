import { IsString, MinLength, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
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
