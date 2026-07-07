import {
  IsEnum, IsNotEmpty, IsNumber, IsOptional,
  IsString, Matches, Min, IsInt,
} from 'class-validator';
import { PaginationFilterDto } from '../common/dto/pagination-filter.dto';
import { CertificateType } from '../common/enums';
import { Type } from 'class-transformer';

export class CreateBirthDeathCertificateDto {
  @IsEnum(CertificateType)
  certificateType: CertificateType;

  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'Enter a valid mobile number' })
  phone?: string;

  @IsString()
  @IsNotEmpty()
  personName: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' })
  eventDate: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' })
  dateOfService: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  numberOfCopies: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amountCharged: number;
}

export class UpdateBirthDeathCertificateDto {
  @IsEnum(CertificateType)
  @IsOptional()
  certificateType?: CertificateType;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  personName?: string;

  @IsString()
  @IsOptional()
  eventDate?: string;

  @IsString()
  @IsOptional()
  dateOfService?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  numberOfCopies?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  amountCharged?: number;
}

export class BirthDeathCertificateFilterDto extends PaginationFilterDto {
  @IsEnum(CertificateType)
  @IsOptional()
  type?: CertificateType;
}
