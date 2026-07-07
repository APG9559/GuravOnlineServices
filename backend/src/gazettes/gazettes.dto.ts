import {
  IsNotEmpty, IsNumber, IsOptional,
  IsString, Matches, Min,
} from 'class-validator';
import { PaginationFilterDto } from '../common/dto/pagination-filter.dto';

export class CreateGazetteDto {
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'Enter a valid mobile number' })
  phone?: string;

  @IsString()
  @IsNotEmpty()
  oldName: string;

  @IsString()
  @IsNotEmpty()
  newName: string;

  @IsString()
  @IsNotEmpty()
  reasonToChangeName: string;

  @IsString()
  @IsOptional()
  tokenNo?: string;

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
}

export class UpdateGazetteDto {
  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'Enter a valid mobile number' })
  phone?: string;

  @IsString()
  @IsOptional()
  oldName?: string;

  @IsString()
  @IsOptional()
  newName?: string;

  @IsString()
  @IsOptional()
  reasonToChangeName?: string;

  @IsString()
  @IsOptional()
  tokenNo?: string;

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
}

export class GazetteFilterDto extends PaginationFilterDto {}
