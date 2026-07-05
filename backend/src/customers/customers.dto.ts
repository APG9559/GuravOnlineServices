import {
  IsEmail, IsNotEmpty, IsOptional, IsString, Matches
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'Enter a valid 10-digit Indian mobile number' })
  phone: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsEmail({}, { message: 'Enter a valid email address' })
  @IsOptional()
  email?: string;
}

export class UpdateCustomerDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'Enter a valid 10-digit Indian mobile number' })
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsEmail({}, { message: 'Enter a valid email address' })
  @IsOptional()
  email?: string;
}

export class CustomerFilterDto {
  @IsString()
  @IsOptional()
  search?: string;
}
