import {
  IsNotEmpty, IsNumber, IsOptional,
  IsString, Matches, Min, IsIn
} from 'class-validator';
import { PaginationFilterDto } from '../common/dto/pagination-filter.dto';

export class CreateExpenseDto {
  @IsString()
  @IsIn(['Shop', 'Home'])
  category: 'Shop' | 'Home';

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' })
  date: string;

  @IsString()
  @IsOptional()
  userId?: string;
}

export class UpdateExpenseDto {
  @IsString()
  @IsIn(['Shop', 'Home'])
  @IsOptional()
  category?: 'Shop' | 'Home';

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' })
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  userId?: string;
}

export class ExpenseFilterDto extends PaginationFilterDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  category?: 'Shop' | 'Home';
}
