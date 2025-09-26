import { IsString, IsEnum, IsNumber, IsDateString, IsPositive, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType, PaymentStatus } from '../entities/loan-history.entity';

export class CreateLoanHistoryDto {
  @IsString()
  loanId: string;

  @IsEnum(TransactionType)
  transactionType: TransactionType;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  amount: number;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsDateString()
  paidDate?: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  remainingBalance?: number;
}