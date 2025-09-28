import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, ForbiddenException } from '@nestjs/common';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('loans')
@UseGuards(JwtAuthGuard)
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  create(@Body() createLoanDto: CreateLoanDto, @Request() req) {
    return this.loansService.create(createLoanDto, req.user.id);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto, @Request() req) {
    if (req.user.role === 'admin') {
      return this.loansService.findAll(paginationDto, req.user.role);
    }
    return this.loansService.findByUser(req.user.id, paginationDto, req.user.role);
  }

  @Get('statistics')
  getStatistics(@Request() req) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admin can view statistics');
    }
    return this.loansService.getStatistics();
  }

  @Get('my-loans')
  findMyLoans(@Query() paginationDto: PaginationDto, @Request() req) {
    return this.loansService.findByUser(req.user.id, paginationDto, req.user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    const userId = req.user.role === 'admin' ? undefined : req.user.id;
    return this.loansService.findOne(id, userId, req.user.role);
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