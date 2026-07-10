import {
  IsNotEmpty, IsNumber, IsOptional,
  IsString, Matches, Min, IsBoolean,
} from 'class-validator';
import { PaginationFilterDto } from '../common/dto/pagination-filter.dto';

export class CreateWaterServiceRecordDto {
  @IsString()
  @IsNotEmpty()
  serviceType:
    | 'NewConnection'
    | 'ConnectionTransfer'
    | 'MeterDisconnection'
    | 'MeterReconnection'
    | 'ChangeOfUse'
    | 'MeterInspection'
    | 'NoDuesCertificate';

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' })
  dateOfService: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' })
  applicationDate: string;

  @IsString()
  @IsOptional()
  applicationTokenNo?: string;

  @IsNumber()
  @Min(0)
  officialFee: number;

  @IsNumber()
  @Min(0)
  serviceFee: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  protocolFee?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  miscFee?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @IsNumber()
  @Min(0)
  amountCharged: number; // Total charged

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsOptional()
  details?: any; // Nested JSON containing plumber, owner details, etc.

  // Flat connection fields for creation or retrieval
  @IsString()
  @IsOptional()
  connectionId?: string;

  @IsString()
  @IsOptional()
  connectionNo?: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'Enter a valid mobile number' })
  phone?: string;

  @IsString()
  @IsOptional()
  connectionAddress?: string;

  @IsString()
  @IsOptional()
  contactPersonName?: string;

  @IsString()
  @IsOptional()
  contactPersonPhone?: string;

  @IsString()
  @IsOptional()
  currentUsage?: string;

  @IsString()
  @IsOptional()
  meterDetails?: string;
}

export class UpdateWaterServiceRecordDto {
  @IsString()
  @IsOptional()
  dateOfService?: string;

  @IsString()
  @IsOptional()
  applicationDate?: string;

  @IsString()
  @IsOptional()
  applicationTokenNo?: string;

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
  miscFee?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  amountCharged?: number;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsOptional()
  details?: any;
}

export class CreateWaterPaymentDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsNotEmpty()
  paymentMode: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' })
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

export class CreateWaterFeeConfigDto {
  @IsString()
  @IsNotEmpty()
  serviceType: string;

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
  defaultMiscFee: number;

  @IsBoolean()
  allowManualOverride: boolean;

  @IsString()
  @IsOptional()
  effectiveDate?: string;
}

export class CreateWaterDocumentDto {
  @IsString()
  @IsNotEmpty()
  documentType: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class WaterSupplyFilterDto extends PaginationFilterDto {}
