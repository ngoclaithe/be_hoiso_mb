import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, ForbiddenException } from '@nestjs/common';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
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
  findAll(@Request() req) {
    // Admin can see all loans, users can only see their own
    if (req.user.role === 'admin') {
      return this.loansService.findAll();
    }
    return this.loansService.findByUser(req.user.id);
  }

  @Get('my-loans')
  findMyLoans(@Request() req) {
    return this.loansService.findByUser(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    const userId = req.user.role === 'admin' ? undefined : req.user.id;
    return this.loansService.findOne(id, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLoanDto: UpdateLoanDto, @Request() req) {
    const userId = req.user.role === 'admin' ? undefined : req.user.id;
    return this.loansService.update(id, updateLoanDto, userId);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string, @Request() req) {
    // Only admin can approve loans
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admin can approve loans');
    }
    return this.loansService.approve(id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Request() req) {
    // Only admin can reject loans
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admin can reject loans');
    }
    return this.loansService.reject(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.role === 'admin' ? undefined : req.user.id;
    return this.loansService.remove(id, userId);
  }
}