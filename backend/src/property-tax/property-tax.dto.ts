import {
  IsNotEmpty, IsNumber, IsOptional,
  IsString, Matches, Min,
} from 'class-validator';

export class CreatePropertyTaxDto {
  @IsString()
  @IsNotEmpty()
  serviceType: string;

  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'Enter a valid 10-digit Indian mobile number' })
  phone: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  propertyTaxNo: string;

  @IsNumber()
  @Min(0)
  officialFee: number;

  @IsNumber()
  @Min(0)
  serviceFee: number;

  @IsNumber()
  @Min(0)
  protocolFee: number;

  @IsNumber()
  @Min(0)
  amountCharged: number;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' })
  dateOfService: string;
}

export class UpdatePropertyTaxDto {
  @IsString()
  @IsOptional()
  serviceType?: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[6-9]\d{9}$/, { message: 'Enter a valid 10-digit Indian mobile number' })
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  propertyTaxNo?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  officialFee?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  serviceFee?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  protocolFee?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  amountCharged?: number;

  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' })
  dateOfService?: string;
}

export class PropertyTaxFilterDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
