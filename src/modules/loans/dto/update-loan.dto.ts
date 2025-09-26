import { PartialType } from '@nestjs/mapped-types';
import { CreateLoanDto } from './create-loan.dto';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { LoanStatus } from '../entities/loan.entity';

export class UpdateLoanDto extends PartialType(CreateLoanDto) {
  @IsOptional()
  @IsEnum(LoanStatus)
  status?: LoanStatus;

  @IsOptional()
  @IsDateString()
  approvedDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}