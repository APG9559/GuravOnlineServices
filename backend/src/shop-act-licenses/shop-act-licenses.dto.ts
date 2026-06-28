import {
  IsEmail, IsNotEmpty, IsNumber, IsOptional,
  IsString, Matches, Min,
} from 'class-validator';

export class CreateShopActLicenseDto {
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'Enter a valid 10-digit Indian mobile number' })
  phone: string;

  @IsString()
  @IsNotEmpty()
  businessName: string;

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

export class ShopActLicenseFilterDto {
  @IsOptional()
  from?: string;

  @IsOptional()
  to?: string;

  @IsOptional()
  search?: string;
}
