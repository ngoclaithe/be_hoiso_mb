import { Controller, Get, Post, Body, Patch, UseGuards, Request } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WithdrawDto } from './dto/withdraw.dto';
import { UpdateBalanceDto } from './dto/update-balance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  getBalance(@Request() req) {
    return this.walletService.getBalance(req.user.id);
  }

  @Post('withdraw')
  withdraw(@Body() withdrawDto: WithdrawDto, @Request() req) {
    return this.walletService.withdraw(req.user.id, withdrawDto);
  }

  @Patch('add-balance')
  addBalance(@Body() updateBalanceDto: UpdateBalanceDto, @Request() req) {
    return this.walletService.addBalance(req.user.id, updateBalanceDto);
  }

  @Patch('set-balance')
  setBalance(@Body() updateBalanceDto: UpdateBalanceDto, @Request() req) {
    return this.walletService.setBalance(req.user.id, updateBalanceDto);
  }
}