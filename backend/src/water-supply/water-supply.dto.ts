import {
  IsNotEmpty, IsNumber, IsOptional,
  IsString, Matches, Min,
} from 'class-validator';
import { PaginationFilterDto } from '../common/dto/pagination-filter.dto';


export class CreateWaterSupplyDto {
  @IsString()
  @IsNotEmpty()
  serviceType: string;

  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'Enter a valid mobile number' })
  phone?: string;

  @IsString()
  @IsNotEmpty()
  connectionAddress: string;

  @IsString()
  @IsNotEmpty()
  applicationTokenNo: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' })
  applicationDate: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' })
  dateOfService: string;

  @IsNumber()
  @Min(0)
  officialFee: number;

  @IsNumber()
  @Min(0)
  serviceFee: number;

  @IsNumber()
  @Min(0)
  amountCharged: number;

  // Specific conditional fields (optional in base DTO, checked conditionally by type if needed)
  @IsString()
  @IsOptional()
  plumberName?: string;

  @IsString()
  @IsOptional()
  plumberPhone?: string;

  @IsString()
  @IsOptional()
  contactPersonName?: string;

  @IsString()
  @IsOptional()
  contactPersonPhone?: string;

  @IsString()
  @IsOptional()
  connectionNo?: string;

  @IsString()
  @IsOptional()
  currentOwner?: string;

  @IsString()
  @IsOptional()
  newOwnerName?: string;

  @IsString()
  @IsOptional()
  newOwnerPhone?: string;

  @IsString()
  @IsOptional()
  transferSubtype?: string;

  @IsString()
  @IsOptional()
  currentUsage?: string;

  @IsString()
  @IsOptional()
  newUsage?: string;
}

export class UpdateWaterSupplyDto {
  @IsString()
  @IsOptional()
  serviceType?: string;

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
  applicationTokenNo?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' })
  applicationDate?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' })
  dateOfService?: string;

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
  amountCharged?: number;

  @IsString()
  @IsOptional()
  plumberName?: string;

  @IsString()
  @IsOptional()
  plumberPhone?: string;

  @IsString()
  @IsOptional()
  contactPersonName?: string;

  @IsString()
  @IsOptional()
  contactPersonPhone?: string;

  @IsString()
  @IsOptional()
  connectionNo?: string;

  @IsString()
  @IsOptional()
  currentOwner?: string;

  @IsString()
  @IsOptional()
  newOwnerName?: string;

  @IsString()
  @IsOptional()
  newOwnerPhone?: string;

  @IsString()
  @IsOptional()
  transferSubtype?: string;

  @IsString()
  @IsOptional()
  currentUsage?: string;

  @IsString()
  @IsOptional()
  newUsage?: string;
}

export class WaterSupplyFilterDto extends PaginationFilterDto {}
