import { IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { PaginationFilterDto } from '../common/dto/pagination-filter.dto';

export class CreatePanCardDto {
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(['New', 'Correction', 'Reprint'])
  @IsNotEmpty()
  applicationType: 'New' | 'Correction' | 'Reprint';

  @IsString()
  @IsOptional()
  ackNo?: string;

  @IsString()
  @IsNotEmpty()
  dateOfService: string;

  @IsNumber()
  @IsNotEmpty()
  officialFee: number;

  @IsNumber()
  @IsNotEmpty()
  serviceFee: number;

  @IsNumber()
  @IsNotEmpty()
  amountCharged: number;
}

export class UpdatePanCardDto {
  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(['New', 'Correction', 'Reprint'])
  @IsOptional()
  applicationType?: 'New' | 'Correction' | 'Reprint';

  @IsString()
  @IsOptional()
  ackNo?: string;

  @IsString()
  @IsOptional()
  dateOfService?: string;

  @IsNumber()
  @IsOptional()
  officialFee?: number;

  @IsNumber()
  @IsOptional()
  serviceFee?: number;

  @IsNumber()
  @IsOptional()
  amountCharged?: number;
}

export class CreatePassportDto {
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(['Fresh', 'Re-issue'])
  @IsNotEmpty()
  applicationType: 'Fresh' | 'Re-issue';

  @IsString()
  @IsOptional()
  fileNo?: string;

  @IsString()
  @IsOptional()
  appointmentDate?: string;

  @IsString()
  @IsNotEmpty()
  dateOfService: string;

  @IsNumber()
  @IsNotEmpty()
  officialFee: number;

  @IsNumber()
  @IsNotEmpty()
  serviceFee: number;

  @IsNumber()
  @IsNotEmpty()
  amountCharged: number;
}

export class UpdatePassportDto {
  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(['Fresh', 'Re-issue'])
  @IsOptional()
  applicationType?: 'Fresh' | 'Re-issue';

  @IsString()
  @IsOptional()
  fileNo?: string;

  @IsString()
  @IsOptional()
  appointmentDate?: string;

  @IsString()
  @IsOptional()
  dateOfService?: string;

  @IsNumber()
  @IsOptional()
  officialFee?: number;

  @IsNumber()
  @IsOptional()
  serviceFee?: number;

  @IsNumber()
  @IsOptional()
  amountCharged?: number;
}


export class CscFilterDto extends PaginationFilterDto {}

export class CreateVoterCardDto {
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(['New', 'Correction', 'Name Deletion', 'Address Change'])
  @IsNotEmpty()
  applicationType: 'New' | 'Correction' | 'Name Deletion' | 'Address Change';

  @IsString()
  @IsOptional()
  epicNo?: string;

  @IsString()
  @IsOptional()
  tokenNo?: string;

  @IsString()
  @IsNotEmpty()
  dateOfService: string;

  @IsNumber()
  @IsNotEmpty()
  officialFee: number;

  @IsNumber()
  @IsNotEmpty()
  serviceFee: number;

  @IsNumber()
  @IsNotEmpty()
  amountCharged: number;
}

export class UpdateVoterCardDto {
  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(['New', 'Correction', 'Name Deletion', 'Address Change'])
  @IsOptional()
  applicationType?: 'New' | 'Correction' | 'Name Deletion' | 'Address Change';

  @IsString()
  @IsOptional()
  epicNo?: string;

  @IsString()
  @IsOptional()
  tokenNo?: string;

  @IsString()
  @IsOptional()
  dateOfService?: string;

  @IsNumber()
  @IsOptional()
  officialFee?: number;

  @IsNumber()
  @IsOptional()
  serviceFee?: number;

  @IsNumber()
  @IsOptional()
  amountCharged?: number;
}
