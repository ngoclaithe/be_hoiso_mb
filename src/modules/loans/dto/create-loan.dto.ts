import { IsString, IsEmail, IsPhoneNumber, IsEnum, IsNumber, IsDateString, IsPositive, Min, Max, IsOptional } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Gender } from '../entities/loan.entity';

export class CreateLoanDto {
  @IsString()
  fullName: string;

  @IsString()
  currentAddress: string;

  @IsString()
  permanentAddress: string;

  @IsString()
  hometown: string;

  @IsString()
  citizenId: string;
  
  @IsOptional()
  @IsString()
  citizenIdFrontUrl?: string;

  @IsOptional()
  @IsString()
  citizenIdBackUrl?: string;

  @IsOptional()
  @IsString()
  portraitUrl?: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsDateString()
  dateOfBirth: string;

  @IsString()
  occupation: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  income: number;

  @IsString()
  loanPurpose: string;

  @IsString()
  contact1Phone: string;

  @IsString()
  contact1Relationship: string;

  @IsString()
  contact2Phone: string;

  @IsString()
  contact2Relationship: string;

  @IsString()
  bankAccountNumber: string;

  @IsString()
  bankName: string;

  @IsString()
  accountHolderName: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  loanAmount: number;

  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(360)
  @Type(() => Number)
  loanTermMonths: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  interestRate: number;

  @IsNumber()
  @Min(1)
  @Max(31)
  @Type(() => Number)
  monthlyPaymentDate: number;
}