import { IsNotEmpty, IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class CreatePaymentDto {
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

export class PaymentFilterDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  paymentMode?: string;

  @IsString()
  @IsOptional()
  account?: string;
}
