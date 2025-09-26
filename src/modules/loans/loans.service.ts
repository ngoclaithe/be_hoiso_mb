import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions } from 'typeorm';
import { LoanEntity, LoanStatus } from './entities/loan.entity';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { PaginationDto, PaginationResult } from '../../common/dto/pagination.dto';

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

    // Remove sensitive data for non-admin users
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

    // Remove sensitive data for non-admin users
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

    // Remove sensitive data for non-admin users
    return userRole !== 'admin' ? this.sanitizeLoanData(loan) : loan;
  }

  private sanitizeLoanData(loan: LoanEntity): LoanEntity {
    const { citizenIdFrontUrl, citizenIdBackUrl, portraitUrl, ...sanitized } = loan;
    return sanitized as LoanEntity;
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

  async getStatistics(): Promise<any> {
    const [
      totalLoans,
      pendingLoans,
      approvedLoans,
      rejectedLoans,
      activeLoans,
      completedLoans,
    ] = await Promise.all([
      this.loanRepository.count(),
      this.loanRepository.count({ where: { status: LoanStatus.PENDING } }),
      this.loanRepository.count({ where: { status: LoanStatus.APPROVED } }),
      this.loanRepository.count({ where: { status: LoanStatus.REJECTED } }),
      this.loanRepository.count({ where: { status: LoanStatus.ACTIVE } }),
      this.loanRepository.count({ where: { status: LoanStatus.COMPLETED } }),
    ]);

    const totalAmount = await this.loanRepository
      .createQueryBuilder('loan')
      .select('SUM(loan.loanAmount)', 'total')
      .getRawOne();

    return {
      totalLoans,
      pendingLoans,
      approvedLoans,
      rejectedLoans,
      activeLoans,
      completedLoans,
      totalLoanAmount: totalAmount?.total || 0,
    };
  }
}