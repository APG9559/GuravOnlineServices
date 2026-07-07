import {
  IsEmail, IsNotEmpty, IsNumber, IsOptional,
  IsString, Matches, Min,
} from 'class-validator';
import { PaginationFilterDto } from '../common/dto/pagination-filter.dto';
import { Transform } from 'class-transformer';

export class CreateShopActLicenseDto {
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'Enter a valid mobile number' })
  phone?: string;

  @IsString()
  @IsNotEmpty()
  businessName: string;

  @Transform(({ value }) => value === '' ? undefined : value)
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' })
  dateOfService: string;

  @IsNumber()
  @Min(0)
  amountCharged: number;
}

export class UpdateShopActLicenseDto {
  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  businessName?: string;

  @Transform(({ value }) => value === '' ? undefined : value)
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  dateOfService?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  amountCharged?: number;
}

export class ShopActLicenseFilterDto extends PaginationFilterDto {}
