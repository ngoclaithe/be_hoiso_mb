import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, ForbiddenException } from '@nestjs/common';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LoanEntity } from './entities/loan.entity';

@Controller('loans')
@UseGuards(JwtAuthGuard)
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  /**
   * Helper method to sanitize loan data for non-admin users
   */
  private sanitizeLoanData(loan: LoanEntity, userRole: string): any {
    if (userRole === 'admin') {
      return loan;
    }

    const { citizenIdFrontUrl, citizenIdBackUrl, portraitUrl, ...sanitizedLoan } = loan;
    
    // Also sanitize user data if present
    if (sanitizedLoan.user) {
      // Fix: Use type assertion or optional destructuring
      const { password, ...sanitizedUser } = sanitizedLoan.user as any;
      sanitizedLoan.user = sanitizedUser;
    }
    
    return sanitizedLoan;
  }

  /**
   * Helper method to sanitize paginated loan data
   */
  private sanitizePaginatedData(result: any, userRole: string): any {
    if (userRole === 'admin') {
      return result;
    }

    return {
      ...result,
      data: result.data.map(loan => this.sanitizeLoanData(loan, userRole))
    };
  }

  @Post()
  create(@Body() createLoanDto: CreateLoanDto, @Request() req) {
    return this.loansService.create(createLoanDto, req.user.id);
  }

  @Get()
  async findAll(@Query() paginationDto: PaginationDto, @Request() req) {
    if (req.user.role === 'admin') {
      return this.loansService.findAll(paginationDto);
    }
    const result = await this.loansService.findByUser(req.user.id, paginationDto);
    return this.sanitizePaginatedData(result, req.user.role);
  }

  @Get('statistics')
  getStatistics(@Request() req) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admin can view statistics');
    }
    return this.loansService.getStatistics();
  }

  @Get('my-loans')
  async findMyLoans(@Query() paginationDto: PaginationDto, @Request() req) {
    const result = await this.loansService.findByUser(req.user.id, paginationDto);
    return this.sanitizePaginatedData(result, req.user.role);
  }

  // New route to get first loan info
  @Get('first-loan')
  async getFirstLoan(@Request() req) {
    const loan = await this.loansService.getFirstLoan(req.user.id);
    return loan ? this.sanitizeLoanData(loan, req.user.role) : null;
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const userId = req.user.role === 'admin' ? undefined : req.user.id;
    const loan = await this.loansService.findOne(id, userId);
    return this.sanitizeLoanData(loan, req.user.role);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLoanDto: UpdateLoanDto, @Request() req) {
    const userId = req.user.role === 'admin' ? undefined : req.user.id;
    return this.loansService.update(id, updateLoanDto, userId);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admin can approve loans');
    }
    return this.loansService.approve(id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admin can reject loans');
    }
    return this.loansService.reject(id);
  }

  @Patch(':id/complete')
  complete(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admin can complete loans');
    }
    return this.loansService.complete(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.role === 'admin' ? undefined : req.user.id;
    return this.loansService.remove(id, userId);
  }
}