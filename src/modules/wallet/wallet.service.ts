import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletEntity } from './entities/wallet.entity';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { UpdateBalanceDto } from './dto/update-balance.dto';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(WalletEntity)
    private walletRepository: Repository<WalletEntity>,
  ) {}

  async createWallet(createWalletDto: CreateWalletDto): Promise<WalletEntity> {
    const existingWallet = await this.walletRepository.findOne({
      where: { userId: createWalletDto.userId }
    });

    if (existingWallet) {
      throw new BadRequestException('Wallet already exists for this user');
    }

    const wallet = this.walletRepository.create({
      userId: createWalletDto.userId,
      balance: 0,
    });

    return this.walletRepository.save(wallet);
  }

  async findByUserId(userId: string): Promise<WalletEntity> {
    const wallet = await this.walletRepository.findOne({
      where: { userId },
      relations: ['user']
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  async getBalance(userId: string): Promise<{ balance: number }> {
    const wallet = await this.findByUserId(userId);
    return { balance: wallet.balance };
  }

  async withdraw(userId: string, withdrawDto: WithdrawDto): Promise<WalletEntity> {
    console.log('=== WITHDRAW START ===');
    console.log('Withdraw params:', { userId, amount: withdrawDto.amount, amountType: typeof withdrawDto.amount });
    
    const wallet = await this.findByUserId(userId);
    console.log('Current wallet:', { id: wallet.id, balance: wallet.balance, balanceType: typeof wallet.balance });

    // Convert to numbers để ensure calculation đúng
    const currentBalance = this.toNumber(wallet.balance);
    const withdrawAmount = this.toNumber(withdrawDto.amount);

    console.log('Converted values:', { currentBalance, withdrawAmount, types: [typeof currentBalance, typeof withdrawAmount] });

    if (currentBalance < withdrawAmount) {
      throw new BadRequestException(`Insufficient balance. Current: ${currentBalance}, Requested: ${withdrawAmount}`);
    }

    const newBalance = currentBalance - withdrawAmount;
    console.log('New balance calculation:', { currentBalance, withdrawAmount, newBalance });
    
    await this.walletRepository.update(wallet.id, { balance: newBalance });
    console.log('Wallet updated successfully');
    
    const updatedWallet = await this.findByUserId(userId);
    console.log('=== WITHDRAW END ===', { finalBalance: updatedWallet.balance });
    return updatedWallet;
  }

  async addBalance(userId: string, updateBalanceDto: UpdateBalanceDto): Promise<WalletEntity> {
    console.log('=== ADD BALANCE START ===');
    console.log('Add balance params:', { 
      userId, 
      amount: updateBalanceDto.amount, 
      amountType: typeof updateBalanceDto.amount,
      amountValue: updateBalanceDto.amount
    });
    
    const wallet = await this.findByUserId(userId);
    console.log('Current wallet:', { 
      id: wallet.id, 
      balance: wallet.balance, 
      balanceType: typeof wallet.balance,
      balanceValue: wallet.balance
    });

    // CRITICAL: Convert both values to proper numbers
    const currentBalance = this.toNumber(wallet.balance);
    const addAmount = this.toNumber(updateBalanceDto.amount);

    console.log('Converted values:', { 
      currentBalance, 
      addAmount, 
      types: [typeof currentBalance, typeof addAmount],
      originalValues: [wallet.balance, updateBalanceDto.amount]
    });

    // Validate converted values
    if (isNaN(currentBalance)) {
      throw new BadRequestException(`Invalid current balance: ${wallet.balance}`);
    }
    if (isNaN(addAmount) || addAmount <= 0) {
      throw new BadRequestException(`Invalid add amount: ${updateBalanceDto.amount}`);
    }

    const newBalance = currentBalance + addAmount;
    console.log('New balance calculation:', { 
      currentBalance, 
      addAmount, 
      newBalance,
      calculation: `${currentBalance} + ${addAmount} = ${newBalance}`
    });
    
    // Update với number value, không phải string
    console.log('Updating wallet with newBalance:', newBalance, 'type:', typeof newBalance);
    const updateResult = await this.walletRepository.update(wallet.id, { balance: newBalance });
    console.log('Update query result:', updateResult);
    
    const updatedWallet = await this.findByUserId(userId);
    console.log('=== ADD BALANCE END ===', { 
      finalBalance: updatedWallet.balance,
      finalBalanceType: typeof updatedWallet.balance
    });
    
    return updatedWallet;
  }

  async setBalance(userId: string, updateBalanceDto: UpdateBalanceDto): Promise<WalletEntity> {
    console.log('=== SET BALANCE START ===');
    console.log('Set balance params:', { userId, amount: updateBalanceDto.amount, amountType: typeof updateBalanceDto.amount });
    
    const wallet = await this.findByUserId(userId);
    
    // Convert to number
    const newBalance = this.toNumber(updateBalanceDto.amount);
    console.log('Converted balance:', { original: updateBalanceDto.amount, converted: newBalance });
    
    if (isNaN(newBalance)) {
      throw new BadRequestException(`Invalid balance amount: ${updateBalanceDto.amount}`);
    }
    
    await this.walletRepository.update(wallet.id, { balance: newBalance });
    console.log('=== SET BALANCE END ===');
    
    return this.findByUserId(userId);
  }

  /**
   * Safely convert value to number, handling string decimals
   */
  private toNumber(value: any): number {
    if (typeof value === 'number') {
      return value;
    }
    
    if (typeof value === 'string') {
      // Remove any extra formatting and convert
      const cleaned = value.replace(/[^\d.-]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
}