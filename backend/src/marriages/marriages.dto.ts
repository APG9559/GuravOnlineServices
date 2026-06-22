import {
  IsArray, IsEmail, IsEnum, IsNotEmpty, IsNumber,
  IsOptional, IsString, IsUUID, Matches, Min, IsObject,
} from 'class-validator';
import { MarriageAct } from '../common/enums';

export class CreateMarriageDto {
  @IsString() @IsNotEmpty() contactName: string;
  @IsString() @Matches(/^[6-9]\d{9}$/) phone: string;
  @IsEmail() @IsOptional() contactEmail?: string;
  @IsString() @IsOptional() address?: string;
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
  @IsNumber() @Min(0) amountCharged: number;
  @IsUUID() @IsOptional() ticketId?: string;
}

export class UpdateMarriageDto {
  @IsString() @IsOptional() contactName?: string;
  @IsString() @IsOptional() phone?: string;
  @IsEmail() @IsOptional() contactEmail?: string;
  @IsString() @IsOptional() address?: string;
  @IsString() @IsOptional() spouse1Name?: string;
  @IsString() @IsOptional() spouse2Name?: string;
  @IsEnum(MarriageAct) @IsOptional() marriageAct?: MarriageAct;
  @IsString() @IsOptional() marriageDate?: string;
  @IsString() @IsOptional() marriagePlace?: string;
  @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsOptional() appointmentDate?: string;
  @IsString() @IsOptional() dateOfService?: string;
  @IsArray() @IsOptional() servicesProvided?: string[];
  @IsArray() @IsUUID(undefined, { each: true }) @IsOptional() affidavitIds?: string[];
  @IsNumber() @Min(0) @IsOptional() amountCharged?: number;
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
  @IsEmail() @IsOptional() contactEmail?: string;
  @IsString() @IsOptional() address?: string;
  @IsArray() @IsOptional() servicesProvided?: string[];
  @IsNumber() @Min(0) amountCharged: number;
  @IsObject() questionnaireData: Record<string, any>;
}

export class UpdateMarriageTicketDto {
  @IsString() @IsOptional() contactName?: string;
  @IsString() @Matches(/^[6-9]\d{9}$/) @IsOptional() phone?: string;
  @IsEmail() @IsOptional() contactEmail?: string;
  @IsString() @IsOptional() address?: string;
  @IsArray() @IsOptional() servicesProvided?: string[];
  @IsNumber() @Min(0) @IsOptional() amountCharged?: number;
  @IsObject() @IsOptional() questionnaireData?: Record<string, any>;
}

export class TicketFilterDto {
  @IsOptional() status?: string;
  @IsOptional() search?: string;
}
