import {
  IsEnum, IsNotEmpty, IsNumber, IsOptional,
  IsString, Matches, Min,
} from 'class-validator';
import { PaginationFilterDto } from '../common/dto/pagination-filter.dto';
import { PropertyCardType } from '../common/enums';

export class CreatePropertyCardDto {
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'Enter a valid mobile number' })
  phone?: string;

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

export class PropertyCardFilterDto extends PaginationFilterDto {
  @IsEnum(PropertyCardType)
  @IsOptional()
  recordType?: PropertyCardType;
}
