import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions } from 'typeorm';
import { LoanEntity, LoanStatus } from './entities/loan.entity';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { PaginationDto, PaginationResult } from '../../common/dto/pagination.dto';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class LoansService {
  constructor(
    @InjectRepository(LoanEntity)
    private loanRepository: Repository<LoanEntity>,
    @Inject(forwardRef(() => WalletService))
    private walletService: WalletService,
    private notificationsService: NotificationsService,
  ) { }

  async create(createLoanDto: CreateLoanDto, userId: string): Promise<LoanEntity> {
    const loan = this.loanRepository.create({
      ...createLoanDto,
      userId,
      dateOfBirth: new Date(createLoanDto.dateOfBirth),
    });

    const savedLoan = await this.loanRepository.save(loan);

    try {
      await this.notificationsService.createLoanNotification(
        userId,
        savedLoan.id,
        savedLoan.fullName
      );
    } catch (error) {
      console.error('Failed to create loan notification:', error);
    }

    return savedLoan;
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginationResult<LoanEntity>> {
    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 10;
    const search = paginationDto.search;
    const status = paginationDto.status;
    const sortBy = paginationDto.sortBy || 'createdAt';
    const sortOrder = paginationDto.sortOrder || 'DESC';

    const skip = (page - 1) * limit;

    const queryOptions: FindManyOptions<LoanEntity> = {
      relations: ['user'],
      skip,
      take: limit,
      order: {
        [sortBy as keyof LoanEntity]: sortOrder,
      },
    };

    if (search && status) {
      queryOptions.where = [
        { fullName: Like(`%${search}%`), status: status as LoanStatus },
        { citizenId: Like(`%${search}%`), status: status as LoanStatus },
        { bankAccountNumber: Like(`%${search}%`), status: status as LoanStatus },
        { user: { username: Like(`%${search}%`) }, status: status as LoanStatus },
      ];
    } else if (search) {
      queryOptions.where = [
        { fullName: Like(`%${search}%`) },
        { citizenId: Like(`%${search}%`) },
        { bankAccountNumber: Like(`%${search}%`) },
        { user: { username: Like(`%${search}%`) } },
      ];
    } else if (status) {
      queryOptions.where = { status: status as LoanStatus };
    }

    const [data, total] = await this.loanRepository.findAndCount(queryOptions);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  async findByUser(userId: string, paginationDto: PaginationDto): Promise<PaginationResult<LoanEntity>> {
    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 10;
    const search = paginationDto.search;
    const status = paginationDto.status;
    const sortBy = paginationDto.sortBy || 'createdAt';
    const sortOrder = paginationDto.sortOrder || 'DESC';

    const skip = (page - 1) * limit;

    const queryOptions: FindManyOptions<LoanEntity> = {
      skip,
      take: limit,
      order: {
        [sortBy as keyof LoanEntity]: sortOrder,
      },
    };

    if (search && status) {
      queryOptions.where = [
        { userId, fullName: Like(`%${search}%`), status: status as LoanStatus },
        { userId, citizenId: Like(`%${search}%`), status: status as LoanStatus },
        { userId, loanPurpose: Like(`%${search}%`), status: status as LoanStatus },
      ];
    } else if (search) {
      queryOptions.where = [
        { userId, fullName: Like(`%${search}%`) },
        { userId, citizenId: Like(`%${search}%`) },
        { userId, loanPurpose: Like(`%${search}%`) },
      ];
    } else if (status) {
      queryOptions.where = { userId, status: status as LoanStatus };
    } else {
      queryOptions.where = { userId };
    }

    const [data, total] = await this.loanRepository.findAndCount(queryOptions);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  async findOne(id: string, userId?: string): Promise<LoanEntity> {
    const whereCondition: any = { id };
    if (userId) {
      whereCondition.userId = userId;
    }

    const loan = await this.loanRepository.findOne({
      where: whereCondition,
      relations: ['user']
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    return loan;
  }

  /**
   * Get first loan (oldest loan) for a user
   */
  async getFirstLoan(userId: string): Promise<LoanEntity | null> {
    const loan = await this.loanRepository.findOne({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'ASC' } // Get the oldest loan first
    });

    return loan;
  }

  private generateContractCode(): string {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
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
  console.log('=== APPROVE LOAN START ===');
  console.log('Approve method called for loan:', id);

  const loan = await this.findOne(id);
  console.log('Found loan:', {
    id: loan.id,
    status: loan.status,
    userId: loan.userId,
    loanAmount: loan.loanAmount,
    loanAmountType: typeof loan.loanAmount,
    loanAmountValue: loan.loanAmount
  });

  if (loan.status !== LoanStatus.PENDING) {
    throw new ForbiddenException('Only pending loans can be approved');
  }

  loan.status = LoanStatus.APPROVED;
  loan.approvedDate = new Date();
  loan.contractCode = this.generateContractCode();
  console.log('Generated contract code:', loan.contractCode);

  const dueDate = new Date();
  dueDate.setMonth(dueDate.getMonth() + loan.loanTermMonths);
  loan.dueDate = dueDate;

  const savedLoan = await this.loanRepository.save(loan);
  console.log('Loan saved with status:', savedLoan.status);

  // Notification
  try {
    console.log('Creating approval notification for userId:', loan.userId);
    const notification = await this.notificationsService.createLoanApprovedNotification(
      loan.userId,
      loan.id,
      loan.loanAmount,
      loan.contractCode
    );
    console.log('Notification created successfully:', notification.id);
  } catch (error) {
    console.error('Failed to create approval notification:', error);
  }

  // Wallet Balance Update - FIXED
  try {
    console.log('=== WALLET BALANCE UPDATE START ===');
    
    // Convert loanAmount to proper number
    const loanAmountNumber = this.convertToNumber(loan.loanAmount);
    console.log('Loan amount conversion:', {
      original: loan.loanAmount,
      originalType: typeof loan.loanAmount,
      converted: loanAmountNumber,
      convertedType: typeof loanAmountNumber
    });

    if (isNaN(loanAmountNumber) || loanAmountNumber <= 0) {
      throw new Error(`Invalid loan amount: ${loan.loanAmount} -> ${loanAmountNumber}`);
    }

    console.log('About to add balance:', {
      userId: loan.userId,
      amount: loanAmountNumber,
      amountType: typeof loanAmountNumber
    });

    const updatedWallet = await this.walletService.addBalance(loan.userId, {
      amount: loanAmountNumber  // Pass as number, not string
    });
    
    console.log('Wallet balance updated successfully:', {
      newBalance: updatedWallet.balance,
      balanceType: typeof updatedWallet.balance
    });
    console.log('=== WALLET BALANCE UPDATE SUCCESS ===');

  } catch (error) {
    console.error('=== WALLET BALANCE UPDATE FAILED ===');
    console.error('Failed to add balance to wallet:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      userId: loan.userId,
      loanAmount: loan.loanAmount,
      loanAmountType: typeof loan.loanAmount
    });
    
    // Rollback loan status if wallet update fails
    try {
      loan.status = LoanStatus.PENDING;
      loan.approvedDate = undefined;
      loan.contractCode = undefined;
      loan.dueDate = undefined;
      await this.loanRepository.save(loan);
      console.log('Loan status rolled back to PENDING due to wallet error');
    } catch (rollbackError) {
      console.error('Failed to rollback loan status:', rollbackError);
    }
    
    // Re-throw error so API returns error response
    throw new Error(`Failed to approve loan: ${error.message}`);
  }

  console.log('=== APPROVE LOAN END ===');
  return savedLoan;
}

/**
 * Helper method to convert loan amount to number
 */
private convertToNumber(value: any): number {
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value === 'string') {
    // Remove any currency symbols, spaces, etc.
    const cleaned = value.replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

  async reject(id: string): Promise<LoanEntity> {
    const loan = await this.findOne(id);

    if (loan.status !== LoanStatus.PENDING) {
      throw new ForbiddenException('Only pending loans can be rejected');
    }

    loan.status = LoanStatus.REJECTED;
    const savedLoan = await this.loanRepository.save(loan);

    try {
      await this.notificationsService.createLoanRejectedNotification(
        loan.userId,
        loan.id,
        loan.fullName
      );
    } catch (error) {
      console.error('Failed to create rejection notification:', error);
    }

    return savedLoan;
  }

  async complete(id: string): Promise<LoanEntity> {
    const loan = await this.findOne(id);

    if (loan.status !== LoanStatus.APPROVED) {
      throw new ForbiddenException('Only approved loans can be completed');
    }

    loan.status = LoanStatus.COMPLETED;
    loan.settlementDate = new Date();

    const savedLoan = await this.loanRepository.save(loan);

    try {
      await this.notificationsService.createLoanCompletedNotification(
        loan.userId,
        loan.id,
        loan.contractCode!
      );
    } catch (error) {
      console.error('Failed to create completion notification:', error);
    }

    return savedLoan;
  }

  async remove(id: string, userId?: string): Promise<void> {
    const loan = await this.findOne(id, userId);

    if (loan.status === LoanStatus.APPROVED) {
      throw new ForbiddenException('Cannot delete approved loan');
    }

    await this.loanRepository.remove(loan);
  }

  async getStatistics(): Promise<any> {
    const [
      totalLoans,
      pendingLoans,
      approvedLoans,
      rejectedLoans,
      completedLoans,
      overdueLoans,
    ] = await Promise.all([
      this.loanRepository.count(),
      this.loanRepository.count({ where: { status: LoanStatus.PENDING } }),
      this.loanRepository.count({ where: { status: LoanStatus.APPROVED } }),
      this.loanRepository.count({ where: { status: LoanStatus.REJECTED } }),
      this.loanRepository.count({ where: { status: LoanStatus.COMPLETED } }),
      this.loanRepository.count({ where: { status: LoanStatus.OVERDUE } }),
    ]);

    const totalAmount = await this.loanRepository
      .createQueryBuilder('loan')
      .select('SUM(loan.loanAmount)', 'total')
      .getRawOne();

    const approvedAmount = await this.loanRepository
      .createQueryBuilder('loan')
      .select('SUM(loan.loanAmount)', 'total')
      .where('loan.status IN (:...statuses)', {
        statuses: [LoanStatus.APPROVED, LoanStatus.COMPLETED]
      })
      .getRawOne();

    return {
      totalLoans,
      pendingLoans,
      approvedLoans,
      rejectedLoans,
      completedLoans,
      overdueLoans,
      totalLoanAmount: totalAmount?.total || 0,
      approvedLoanAmount: approvedAmount?.total || 0,
    };
  }
}