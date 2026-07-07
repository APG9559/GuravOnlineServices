import {
  IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum, IsArray, ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationFilterDto } from '../common/dto/pagination-filter.dto';

export class CreateTradeTypeConfigDto {
  @IsString()
  @IsNotEmpty()
  tradeType: string;

  @IsString()
  @IsNotEmpty()
  tradeSubtype: string;

  @IsNumber()
  @IsNotEmpty()
  officialFee: number;

  @IsNumber()
  @IsOptional()
  fireFee?: number;

  @IsNumber()
  @IsOptional()
  renewalFireFee?: number;
}

export class CreateTradeLicenseRecordDto {
  @IsEnum(['New', 'Renew', 'Transfer_Heir', 'Transfer_Third_Party', 'Name_Change', 'Trade_Change', 'Partner_Change', 'Cancel'])
  @IsNotEmpty()
  serviceType: 'New' | 'Renew' | 'Transfer_Heir' | 'Transfer_Third_Party' | 'Name_Change' | 'Trade_Change' | 'Partner_Change' | 'Cancel';

  @IsString()
  @IsNotEmpty()
  dateOfService: string;

  @IsNumber()
  @IsNotEmpty()
  amountCharged: number;

  @IsNumber()
  @IsNotEmpty()
  officialFee: number;

  @IsNumber()
  @IsNotEmpty()
  serviceFee: number;

  @IsNumber()
  @IsOptional()
  protocolFee?: number;

  @IsNumber()
  @IsOptional()
  miscFee?: number;

  @IsString()
  @IsOptional()
  tokenNo?: string;

  @IsOptional()
  details?: any;

  @IsString()
  @IsOptional()
  businessId?: string;

  @IsString()
  @IsOptional()
  linkedAffidavitId?: string;

  @IsString()
  @IsOptional()
  linkedPropertyCardId?: string;

  @IsString()
  @IsOptional()
  linkedShopActId?: string;

  @IsOptional()
  newBusinessData?: {
    name: string;
    tradeType: string;
    tradeSubtype: string;
    email?: string;
    phone?: string;
    partners: {
      name: string;
      phone: string;
      email?: string;
    }[];
  };
}

export class UpdateTradeLicenseRecordDto {
  @IsEnum(['New', 'Renew', 'Transfer_Heir', 'Transfer_Third_Party', 'Name_Change', 'Trade_Change', 'Partner_Change', 'Cancel'])
  @IsOptional()
  serviceType?: 'New' | 'Renew' | 'Transfer_Heir' | 'Transfer_Third_Party' | 'Name_Change' | 'Trade_Change' | 'Partner_Change' | 'Cancel';

  @IsString()
  @IsOptional()
  dateOfService?: string;

  @IsNumber()
  @IsOptional()
  amountCharged?: number;

  @IsNumber()
  @IsOptional()
  officialFee?: number;

  @IsNumber()
  @IsOptional()
  serviceFee?: number;

  @IsNumber()
  @IsOptional()
  protocolFee?: number;

  @IsNumber()
  @IsOptional()
  miscFee?: number;

  @IsString()
  @IsOptional()
  tokenNo?: string;

  @IsOptional()
  details?: any;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  linkedAffidavitId?: string;

  @IsString()
  @IsOptional()
  linkedPropertyCardId?: string;

  @IsString()
  @IsOptional()
  linkedShopActId?: string;
}

export class TradeLicenseFilterDto extends PaginationFilterDto {}

export class CreateTradeLicensePaymentDto {
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  paymentMode: string;

  @IsString()
  @IsNotEmpty()
  account: string;

  @IsString()
  @IsNotEmpty()
  paymentDate: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class TradeLicensePaymentFilterDto extends PaginationFilterDto {
  @IsString()
  @IsOptional()
  paymentMode?: string;

  @IsString()
  @IsOptional()
  account?: string;
}
