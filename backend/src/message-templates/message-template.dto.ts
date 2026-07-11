import { IsNotEmpty, IsString, IsArray, IsOptional } from 'class-validator';

export class CreateMessageTemplateDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsArray()
  @IsString({ each: true })
  modules: string[];

  @IsString()
  @IsNotEmpty()
  body: string;
}

export class UpdateMessageTemplateDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  label?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  modules?: string[];

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  body?: string;
}
