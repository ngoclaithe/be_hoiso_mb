import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanHistoryEntity, PaymentStatus, TransactionType } from './entities/loan-history.entity';
import { CreateLoanHistoryDto } from './dto/create-loan-history.dto';
import { UpdateLoanHistoryDto } from './dto/update-loan-history.dto';

@Injectable()
export class LoanHistoryService {
  constructor(
    @InjectRepository(LoanHistoryEntity)
    private loanHistoryRepository: Repository<LoanHistoryEntity>,
  ) {}

  async create(createLoanHistoryDto: CreateLoanHistoryDto): Promise<LoanHistoryEntity> {
    const loanHistory = this.loanHistoryRepository.create({
      loan: { id: createLoanHistoryDto.loanId },
      transactionType: createLoanHistoryDto.transactionType,
      amount: createLoanHistoryDto.amount,
      dueDate: new Date(createLoanHistoryDto.dueDate),
      paidDate: createLoanHistoryDto.paidDate ? new Date(createLoanHistoryDto.paidDate) : undefined,
      status: createLoanHistoryDto.status || PaymentStatus.PENDING,
      notes: createLoanHistoryDto.notes,
      remainingBalance: createLoanHistoryDto.remainingBalance,
    });

    return this.loanHistoryRepository.save(loanHistory);
  }

  async findAll(): Promise<LoanHistoryEntity[]> {
    return this.loanHistoryRepository.find({
      relations: ['loan'],
      order: { createdAt: 'DESC' }
    });
  }

  async findByLoan(loanId: string): Promise<LoanHistoryEntity[]> {
    return this.loanHistoryRepository.find({
      where: { loanId },
      order: { dueDate: 'ASC' }
    });
  }

  async findOne(id: string): Promise<LoanHistoryEntity> {
    const loanHistory = await this.loanHistoryRepository.findOne({
      where: { id },
      relations: ['loan']
    });

    if (!loanHistory) {
      throw new NotFoundException('Loan history not found');
    }

    return loanHistory;
  }

  async update(id: string, updateLoanHistoryDto: UpdateLoanHistoryDto): Promise<LoanHistoryEntity> {
    const loanHistory = await this.findOne(id);

    if (updateLoanHistoryDto.dueDate) {
      loanHistory.dueDate = new Date(updateLoanHistoryDto.dueDate);
    }

    if (updateLoanHistoryDto.paidDate) {
      loanHistory.paidDate = new Date(updateLoanHistoryDto.paidDate);
    }

    if (updateLoanHistoryDto.transactionType) {
      loanHistory.transactionType = updateLoanHistoryDto.transactionType;
    }

    if (updateLoanHistoryDto.amount) {
      loanHistory.amount = updateLoanHistoryDto.amount;
    }

    if (updateLoanHistoryDto.status) {
      loanHistory.status = updateLoanHistoryDto.status;
    }

    if (updateLoanHistoryDto.notes) {
      loanHistory.notes = updateLoanHistoryDto.notes;
    }

    if (updateLoanHistoryDto.remainingBalance !== undefined) {
      loanHistory.remainingBalance = updateLoanHistoryDto.remainingBalance;
    }

    return this.loanHistoryRepository.save(loanHistory);
  }

  async markAsPaid(id: string, paidDate?: Date): Promise<LoanHistoryEntity> {
    const loanHistory = await this.findOne(id);
    
    loanHistory.status = PaymentStatus.PAID;
    loanHistory.paidDate = paidDate || new Date();

    return this.loanHistoryRepository.save(loanHistory);
  }

  async markAsOverdue(id: string): Promise<LoanHistoryEntity> {
    const loanHistory = await this.findOne(id);
    loanHistory.status = PaymentStatus.OVERDUE;
    return this.loanHistoryRepository.save(loanHistory);
  }

  async remove(id: string): Promise<void> {
    const loanHistory = await this.findOne(id);
    await this.loanHistoryRepository.remove(loanHistory);
  }

  async generatePaymentSchedule(loanId: string, loanAmount: number, interestRate: number, termMonths: number, monthlyPaymentDate: number): Promise<LoanHistoryEntity[]> {
    const monthlyInterestRate = interestRate / 100 / 12;
    const monthlyPayment = loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, termMonths)) / (Math.pow(1 + monthlyInterestRate, termMonths) - 1);
    
    const savedSchedule: LoanHistoryEntity[] = [];
    let remainingBalance = loanAmount;

    for (let month = 1; month <= termMonths; month++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + month);
      dueDate.setDate(monthlyPaymentDate);

      const interestPayment = remainingBalance * monthlyInterestRate;
      const principalPayment = monthlyPayment - interestPayment;
      remainingBalance -= principalPayment;

      const paymentData: CreateLoanHistoryDto = {
        loanId,
        transactionType: TransactionType.PAYMENT,
        amount: monthlyPayment,
        dueDate: dueDate.toISOString(),
        status: PaymentStatus.PENDING,
        remainingBalance: Math.max(0, remainingBalance),
        notes: `Monthly payment ${month}/${termMonths}`
      };

      const savedPayment = await this.create(paymentData);
      savedSchedule.push(savedPayment);
    }

    return savedSchedule;
  }
}