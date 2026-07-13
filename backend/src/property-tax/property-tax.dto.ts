import {
  IsBoolean, IsNotEmpty, IsNumber, IsOptional,
  IsString, Matches, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationFilterDto } from '../common/dto/pagination-filter.dto';

// ── Record DTOs ──────────────────────────────────────────────────────────────

export class CreatePropertyTaxRecordDto {
  @IsString()
  @IsNotEmpty()
  serviceType: string;

  @IsString()
  @IsOptional()
  propertyId?: string;

  @IsString()
  @IsNotEmpty()
  propertyTaxNo: string;

  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'Enter a valid mobile number' })
  phone?: string;

  @IsString()
  @IsNotEmpty()
  address: string;

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

export class UpdatePropertyTaxRecordDto {
  @IsString()
  @IsOptional()
  serviceType?: string;

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

  @IsOptional()
  details?: any;
}

// ── Payment DTOs ─────────────────────────────────────────────────────────────

export class CreatePropertyTaxPaymentDto {
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  paymentMode: string;

  @IsString()
  @IsNotEmpty()
  paymentDate: string;

  @IsString()
  @IsNotEmpty()
  account: string;

  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

// ── Fee Config DTOs ──────────────────────────────────────────────────────────

export class CreatePropertyTaxFeeConfigDto {
  @IsString()
  @IsNotEmpty()
  serviceType: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  officialFee: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  serviceFee: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  protocolFee?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  defaultMiscFee?: number;

  @IsBoolean()
  @IsOptional()
  allowManualOverride?: boolean;

  @IsString()
  @IsOptional()
  effectiveDate?: string;
}

// ── Filter DTOs ──────────────────────────────────────────────────────────────

export class PropertyTaxFilterDto extends PaginationFilterDto {}

// Legacy — kept for data migration reference (not used in new endpoints)
export class LegacyCreatePropertyTaxDto {
  @IsString() @IsNotEmpty() serviceType: string;
  @IsString() @IsNotEmpty() customerName: string;
  @IsString() @IsOptional() @Matches(/^\+?[0-9]{7,15}$/) phone?: string;
  @IsString() @IsNotEmpty() address: string;
  @IsString() @IsNotEmpty() propertyTaxNo: string;
  @IsNumber() @Min(0) officialFee: number;
  @IsNumber() @Min(0) serviceFee: number;
  @IsNumber() @Min(0) protocolFee: number;
  @IsNumber() @Min(0) amountCharged: number;
  @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/) dateOfService: string;
}
