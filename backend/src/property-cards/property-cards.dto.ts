import {
  IsEnum, IsNotEmpty, IsNumber, IsOptional,
  IsString, Matches, Min,
} from 'class-validator';
import { PropertyCardType } from '../common/enums';

export class CreatePropertyCardDto {
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'Enter a valid 10-digit Indian mobile number' })
  phone: string;

  @IsEnum(PropertyCardType)
  recordType: PropertyCardType;

  @IsString()
  @IsNotEmpty()
  propertyNumber: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' })
  dateOfService: string;

  @IsNumber()
  @Min(0)
  amountCharged: number;
}

export class UpdatePropertyCardDto {
  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(PropertyCardType)
  @IsOptional()
  recordType?: PropertyCardType;

  @IsString()
  @IsOptional()
  propertyNumber?: string;

  @IsString()
  @IsOptional()
  dateOfService?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  amountCharged?: number;
}

export class PropertyCardFilterDto {
  @IsOptional()
  from?: string;

  @IsOptional()
  to?: string;

  @IsOptional()
  search?: string;

  @IsEnum(PropertyCardType)
  @IsOptional()
  recordType?: PropertyCardType;
}
