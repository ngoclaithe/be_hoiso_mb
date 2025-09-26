import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanEntity, LoanStatus } from './entities/loan.entity';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';

@Injectable()
export class LoansService {
  constructor(
    @InjectRepository(LoanEntity)
    private loanRepository: Repository<LoanEntity>,
  ) {}

  async create(createLoanDto: CreateLoanDto, userId: string): Promise<LoanEntity> {
    const loan = this.loanRepository.create({
      ...createLoanDto,
      userId,
      dateOfBirth: new Date(createLoanDto.dateOfBirth),
    });

    return this.loanRepository.save(loan);
  }

  async findAll(): Promise<LoanEntity[]> {
    return this.loanRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });
  }

  async findByUser(userId: string): Promise<LoanEntity[]> {
    return this.loanRepository.find({
      where: { userId },
      relations: ['histories'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string, userId?: string): Promise<LoanEntity> {
    const whereCondition: any = { id };
    if (userId) {
      whereCondition.userId = userId;
    }

    const loan = await this.loanRepository.findOne({
      where: whereCondition,
      relations: ['user', 'histories']
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    return loan;
  }

  async update(id: string, updateLoanDto: UpdateLoanDto, userId?: string): Promise<LoanEntity> {
    const loan = await this.findOne(id, userId);

    if (updateLoanDto.dateOfBirth) {
      updateLoanDto.dateOfBirth = new Date(updateLoanDto.dateOfBirth).toISOString();
    }

    if (updateLoanDto.approvedDate) {
      updateLoanDto.approvedDate = new Date(updateLoanDto.approvedDate).toISOString();
    }

    if (updateLoanDto.dueDate) {
      updateLoanDto.dueDate = new Date(updateLoanDto.dueDate).toISOString();
    }

    Object.assign(loan, updateLoanDto);
    return this.loanRepository.save(loan);
  }

  async approve(id: string): Promise<LoanEntity> {
    const loan = await this.findOne(id);
    
    loan.status = LoanStatus.APPROVED;
    loan.approvedDate = new Date();
    
    // Calculate due date based on loan term
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + loan.loanTermMonths);
    loan.dueDate = dueDate;

    return this.loanRepository.save(loan);
  }

  async reject(id: string): Promise<LoanEntity> {
    const loan = await this.findOne(id);
    loan.status = LoanStatus.REJECTED;
    return this.loanRepository.save(loan);
  }

  async remove(id: string, userId?: string): Promise<void> {
    const loan = await this.findOne(id, userId);
    
    if (loan.status === LoanStatus.ACTIVE) {
      throw new ForbiddenException('Cannot delete active loan');
    }

    await this.loanRepository.remove(loan);
  }
}