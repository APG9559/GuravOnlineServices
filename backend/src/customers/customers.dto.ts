import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from "class-validator";
import { PaginationFilterDto } from "../common/dto/pagination-filter.dto";
import { Transform } from "class-transformer";

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+?[0-9]{7,15}$/, {
    message: "Enter a valid mobile number",
  })
  phone: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsEmail({}, { message: "Enter a valid email address" })
  @IsOptional()
  email?: string;
}

export class UpdateCustomerDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, {
    message: "Enter a valid mobile number",
  })
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsEmail({}, { message: "Enter a valid email address" })
  @IsOptional()
  email?: string;
}

export class CustomerFilterDto extends PaginationFilterDto {}
