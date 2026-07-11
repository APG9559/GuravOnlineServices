import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  MaxLength,
} from 'class-validator';

export class CreateMessageLogDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  module: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  templateId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  templateLabel?: string;

  @IsString()
  @IsIn(['whatsapp', 'sms'])
  channel: 'whatsapp' | 'sms';

  @IsOptional()
  @IsString()
  @MaxLength(255)
  recipientName?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  recipientPhone: string;

  @IsString()
  @IsNotEmpty()
  messageBody: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  recordId?: string;
}
