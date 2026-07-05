import {
  IsArray, IsEmail, IsEnum, IsNotEmpty, IsNumber,
  IsOptional, IsString, IsUUID, Matches, Min, IsObject,
  IsBoolean, IsIn, ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { MarriageAct } from '../common/enums';

export class CreateMarriageDto {
  @IsString() @IsNotEmpty() contactName: string;
  @IsString() @Matches(/^[6-9]\d{9}$/) phone: string;
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsEmail() @IsOptional() contactEmail?: string;
  @IsString() @IsOptional() address?: string;
  @IsBoolean() @IsOptional() isPrimaryContactSpouse?: boolean;
  @IsString() @IsOptional() @IsIn(['husband', 'wife']) primaryContactSpouseType?: string;
  @IsString() @IsNotEmpty() spouse1Name: string;
  @IsString() @IsNotEmpty() spouse2Name: string;
  @IsEnum(MarriageAct) marriageAct: MarriageAct;
  @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/) marriageDate: string;
  @IsString() @IsOptional() marriagePlace?: string;
  @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsOptional() appointmentDate?: string;
  @IsObject() @IsOptional() affidavitDates?: Record<string, string>;
  @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/) dateOfService: string;
  @IsArray() @IsOptional() servicesProvided?: string[];
  @IsArray() @IsUUID(undefined, { each: true }) @IsOptional() affidavitIds?: string[];
  @IsNumber() @Min(0) @Type(() => Number) amountCharged: number;
  @IsNumber() @Min(0) @IsOptional() @Type(() => Number) officialFee?: number;
  @IsNumber() @Min(0) @IsOptional() @Type(() => Number) courtFeeTickets?: number;
  @IsNumber() @Min(0) @IsOptional() @Type(() => Number) miscFee?: number;
  @IsUUID() @IsOptional() ticketId?: string;
}

export class UpdateMarriageDto {
  @IsString() @IsOptional() contactName?: string;
  @IsString() @IsOptional() phone?: string;
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsEmail() @IsOptional() contactEmail?: string;
  @IsString() @IsOptional() address?: string;
  @IsBoolean() @IsOptional() isPrimaryContactSpouse?: boolean;
  @IsString() @IsOptional() @IsIn(['husband', 'wife']) primaryContactSpouseType?: string;
  @IsString() @IsOptional() spouse1Name?: string;
  @IsString() @IsOptional() spouse2Name?: string;
  @IsEnum(MarriageAct) @IsOptional() marriageAct?: MarriageAct;
  @IsString() @IsOptional() marriageDate?: string;
  @IsString() @IsOptional() marriagePlace?: string;
  @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsOptional() appointmentDate?: string;
  @IsString() @IsOptional() dateOfService?: string;
  @IsArray() @IsOptional() servicesProvided?: string[];
  @IsArray() @IsUUID(undefined, { each: true }) @IsOptional() affidavitIds?: string[];
  @IsNumber() @Min(0) @IsOptional() @Type(() => Number) amountCharged?: number;
  @IsNumber() @Min(0) @IsOptional() @Type(() => Number) officialFee?: number;
  @IsNumber() @Min(0) @IsOptional() @Type(() => Number) courtFeeTickets?: number;
  @IsNumber() @Min(0) @IsOptional() @Type(() => Number) miscFee?: number;
}

export class MarriageFilterDto {
  @IsOptional() from?: string;
  @IsOptional() to?: string;
  @IsOptional() search?: string;
}

// ── Ticket DTOs ───────────────────────────────────────────────────────────

export class CreateMarriageTicketDto {
  @IsString() @IsNotEmpty() contactName: string;
  @IsString() @Matches(/^[6-9]\d{9}$/) phone: string;
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsEmail() @IsOptional() contactEmail?: string;
  @IsString() @IsOptional() address?: string;
  @IsBoolean() @IsOptional() isPrimaryContactSpouse?: boolean;
  @IsString() @IsOptional() @IsIn(['husband', 'wife']) primaryContactSpouseType?: string;
  @IsArray() @IsOptional() servicesProvided?: string[];
  @IsNumber() @Min(0) @Type(() => Number) amountCharged: number;
  @IsObject() questionnaireData: Record<string, any>;
}

export class UpdateMarriageTicketDto {
  @IsString() @IsOptional() contactName?: string;
  @IsString() @Matches(/^[6-9]\d{9}$/) @IsOptional() phone?: string;
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsEmail() @IsOptional() contactEmail?: string;
  @IsString() @IsOptional() address?: string;
  @IsBoolean() @IsOptional() isPrimaryContactSpouse?: boolean;
  @IsString() @IsOptional() @IsIn(['husband', 'wife']) primaryContactSpouseType?: string;
  @IsArray() @IsOptional() servicesProvided?: string[];
  @IsNumber() @Min(0) @IsOptional() @Type(() => Number) amountCharged?: number;
  @IsObject() @IsOptional() questionnaireData?: Record<string, any>;
}

export class TicketFilterDto {
  @IsOptional() status?: string;
  @IsOptional() search?: string;
}

export class CreatePaymentDto {
  @IsNumber() @Min(0.01) @Type(() => Number) amount: number;
  @IsString() @IsNotEmpty() paymentMode: string;
  @IsString() @IsNotEmpty() account: string;
  @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/) paymentDate: string;
  @IsString() @IsOptional() notes?: string;
}

export class ConfirmTicketPayloadDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePaymentDto)
  payment?: CreatePaymentDto;
}

export class AddPaymentDto extends CreatePaymentDto {
  @IsUUID() @IsOptional() ticketId?: string;
  @IsUUID() @IsOptional() marriageId?: string;
}

export class PaymentFilterDto {
  @IsOptional() @IsString() paymentMode?: string;
  @IsOptional() @IsString() account?: string;
  @IsOptional() @IsString() search?: string;
}
