import { IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBalanceDto {
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  amount: number;
}