import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum, Min, IsPositive, IsUUID } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { TransactionType } from '../entities/transaction.entity';

export class CreateTransactionDto {
  @IsNotEmpty({ message: 'User ID should not be empty' })
  @IsUUID(4, { message: 'User ID must be a valid UUID' })
  userId: string;

  @IsNotEmpty({ message: 'Amount should not be empty' })
  @Type(() => Number) 
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Amount must have at most 2 decimal places' })
  @IsPositive({ message: 'Amount must be greater than 0' })
  amount: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  referenceId?: string;
}

export class DepositDto {
  @IsNotEmpty({ message: 'Amount should not be empty' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Amount must have at most 2 decimal places' })
  @IsPositive({ message: 'Amount must be greater than 0' })
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  referenceId?: string;
}

export class WithdrawTransactionDto {
  @IsNotEmpty({ message: 'Amount should not be empty' })
  @Type(() => Number) 
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Amount must have at most 2 decimal places' })
  @IsPositive({ message: 'Amount must be greater than 0' })
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;
}