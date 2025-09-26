import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { LoanHistoryService } from './loan-history.service';
import { CreateLoanHistoryDto } from './dto/create-loan-history.dto';
import { UpdateLoanHistoryDto } from './dto/update-loan-history.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('loan-history')
@UseGuards(JwtAuthGuard)
export class LoanHistoryController {
  constructor(private readonly loanHistoryService: LoanHistoryService) {}

  @Post()
  create(@Body() createLoanHistoryDto: CreateLoanHistoryDto) {
    return this.loanHistoryService.create(createLoanHistoryDto);
  }

  @Get()
  findAll(@Query('loanId') loanId?: string) {
    if (loanId) {
      return this.loanHistoryService.findByLoan(loanId);
    }
    return this.loanHistoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.loanHistoryService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLoanHistoryDto: UpdateLoanHistoryDto) {
    return this.loanHistoryService.update(id, updateLoanHistoryDto);
  }

  @Patch(':id/mark-paid')
  markAsPaid(@Param('id') id: string) {
    return this.loanHistoryService.markAsPaid(id);
  }

  @Patch(':id/mark-overdue')
  markAsOverdue(@Param('id') id: string) {
    return this.loanHistoryService.markAsOverdue(id);
  }

  @Post('generate-schedule')
  generatePaymentSchedule(@Body() body: { loanId: string; loanAmount: number; interestRate: number; termMonths: number; monthlyPaymentDate: number }) {
    return this.loanHistoryService.generatePaymentSchedule(
      body.loanId,
      body.loanAmount,
      body.interestRate,
      body.termMonths,
      body.monthlyPaymentDate
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.loanHistoryService.remove(id);
  }
}