import { IsNotEmpty, IsOptional, IsString, IsNumber, Min, IsBoolean } from 'class-validator';

export class CreateFeeConfigDto {
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
