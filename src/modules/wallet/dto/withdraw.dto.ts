import { IsNumber, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class WithdrawDto {
  @IsNumber()
  @IsPositive()
  @Min(1000)
  @Type(() => Number)
  amount: number;
}