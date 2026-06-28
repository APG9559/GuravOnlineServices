import { IsNumber, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePricingDto {
  @IsObject()
  // map of key → new numeric value  e.g. { magistrate_fee: 900 }
  updates: Record<string, number>;
}

export class SingleUpdateDto {
  @IsNumber()
  @Type(() => Number)
  value: number;
}
