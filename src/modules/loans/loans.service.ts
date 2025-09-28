import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions } from 'typeorm';
import { LoanEntity, LoanStatus } from './entities/loan.entity';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { PaginationDto, PaginationResult } from '../../common/dto/pagination.dto';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class LoansService {
  constructor(
    @InjectRepository(LoanEntity)
    private loanRepository: Repository<LoanEntity>,
    @Inject(forwardRef(() => WalletService))
    private walletService: WalletService,
  ) {}

  async create(createLoanDto: CreateLoanDto, userId: string): Promise<LoanEntity> {
    const loan = this.loanRepository.create({
      ...createLoanDto,
      userId,
      dateOfBirth: new Date(createLoanDto.dateOfBirth),
    });

    return this.loanRepository.save(loan);
  }

  async findAll(paginationDto: PaginationDto, userRole?: string): Promise<PaginationResult<LoanEntity>> {
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

    const sanitizedData = userRole !== 'admin' 
      ? data.map(loan => this.sanitizeLoanData(loan))
      : data;

    const totalPages = Math.ceil(total / limit);

    return {
      data: sanitizedData,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  async findByUser(userId: string, paginationDto: PaginationDto, userRole?: string): Promise<PaginationResult<LoanEntity>> {
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

    const sanitizedData = userRole !== 'admin' 
      ? data.map(loan => this.sanitizeLoanData(loan))
      : data;

    const totalPages = Math.ceil(total / limit);

    return {
      data: sanitizedData,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  async findOne(id: string, userId?: string, userRole?: string): Promise<LoanEntity> {
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

    return userRole !== 'admin' ? this.sanitizeLoanData(loan) : loan;
  }

  private sanitizeLoanData(loan: LoanEntity): LoanEntity {
    const { citizenIdFrontUrl, citizenIdBackUrl, portraitUrl, ...sanitized } = loan;
    return sanitized as LoanEntity;
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
    const loan = await this.findOne(id);
    
    if (loan.status !== LoanStatus.PENDING) {
      throw new ForbiddenException('Only pending loans can be approved');
    }
    
    loan.status = LoanStatus.APPROVED;
    loan.approvedDate = new Date();
    loan.contractCode = this.generateContractCode();
    
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + loan.loanTermMonths);
    loan.dueDate = dueDate;

    const savedLoan = await this.loanRepository.save(loan);

    try {
      await this.walletService.addBalance(loan.userId, {
        amount: loan.loanAmount
      });
    } catch (error) {
      console.error('Failed to add balance to wallet:', error);
    }

    return savedLoan;
  }

  async reject(id: string): Promise<LoanEntity> {
    const loan = await this.findOne(id);
    
    if (loan.status !== LoanStatus.PENDING) {
      throw new ForbiddenException('Only pending loans can be rejected');
    }
    
    loan.status = LoanStatus.REJECTED;
    return this.loanRepository.save(loan);
  }

  async complete(id: string): Promise<LoanEntity> {
    const loan = await this.findOne(id);
    
    if (loan.status !== LoanStatus.ACTIVE && loan.status !== LoanStatus.APPROVED) {
      throw new ForbiddenException('Only active or approved loans can be completed');
    }
    
    loan.status = LoanStatus.COMPLETED;
    loan.settlementDate = new Date();
    
    return this.loanRepository.save(loan);
  }

  async activate(id: string): Promise<LoanEntity> {
    const loan = await this.findOne(id);
    
    if (loan.status !== LoanStatus.APPROVED) {
      throw new ForbiddenException('Only approved loans can be activated');
    }
    
    loan.status = LoanStatus.ACTIVE;
    return this.loanRepository.save(loan);
  }

  async remove(id: string, userId?: string): Promise<void> {
    const loan = await this.findOne(id, userId);
    
    if (loan.status === LoanStatus.ACTIVE) {
      throw new ForbiddenException('Cannot delete active loan');
    }

    await this.loanRepository.remove(loan);
  }

  async getStatistics(): Promise<any> {
    const [
      totalLoans,
      pendingLoans,
      approvedLoans,
      rejectedLoans,
      activeLoans,
      completedLoans,
      overdueLoans,
    ] = await Promise.all([
      this.loanRepository.count(),
      this.loanRepository.count({ where: { status: LoanStatus.PENDING } }),
      this.loanRepository.count({ where: { status: LoanStatus.APPROVED } }),
      this.loanRepository.count({ where: { status: LoanStatus.REJECTED } }),
      this.loanRepository.count({ where: { status: LoanStatus.ACTIVE } }),
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
        statuses: [LoanStatus.APPROVED, LoanStatus.ACTIVE, LoanStatus.COMPLETED] 
      })
      .getRawOne();

    return {
      totalLoans,
      pendingLoans,
      approvedLoans,
      rejectedLoans,
      activeLoans,
      completedLoans,
      overdueLoans,
      totalLoanAmount: totalAmount?.total || 0,
      approvedLoanAmount: approvedAmount?.total || 0,
    };
  }
}