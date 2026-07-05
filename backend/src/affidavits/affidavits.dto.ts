import {
  IsEnum, IsNotEmpty, IsNumber, IsOptional,
  IsString, Matches, Min,
} from 'class-validator';
import { PaperType, AuthorizerType } from '../common/enums';
import { Type } from 'class-transformer';

export class CreateAffidavitDto {
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'Enter a valid 10-digit Indian mobile number' })
  phone: string;

  @IsString()
  @IsNotEmpty()
  purpose: string;

  @IsString()
  @IsOptional()
  affidavitNo?: string;

  @IsEnum(PaperType)
  paperType: PaperType;

  @IsEnum(AuthorizerType)
  authorizerType: AuthorizerType;

  @IsString()
  @IsOptional()
  authorizerName?: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' })
  dateOfService: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amountCharged: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  notaryPublicFee?: number;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsOptional()
  customerBroughtStamp?: boolean;
}

export class UpdateAffidavitDto {
  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  purpose?: string;

  @IsString()
  @IsOptional()
  affidavitNo?: string;

  @IsEnum(PaperType)
  @IsOptional()
  paperType?: PaperType;

  @IsEnum(AuthorizerType)
  @IsOptional()
  authorizerType?: AuthorizerType;

  @IsString()
  @IsOptional()
  authorizerName?: string;

  @IsString()
  @IsOptional()
  dateOfService?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  amountCharged?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  notaryPublicFee?: number;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsOptional()
  customerBroughtStamp?: boolean;
}

export class AffidavitFilterDto {
  @IsOptional()
  from?: string;

  @IsOptional()
  to?: string;

  @IsOptional()
  search?: string;
}
