import { PartialType } from '@nestjs/mapped-types';
import { CreateLoanHistoryDto } from './create-loan-history.dto';

export class UpdateLoanHistoryDto extends PartialType(CreateLoanHistoryDto) {}
