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
    const wallet = await this.findByUserId(userId);

    if (wallet.balance < withdrawDto.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const newBalance = wallet.balance - withdrawDto.amount;
    
    await this.walletRepository.update(wallet.id, { balance: newBalance });
    
    return this.findByUserId(userId);
  }

  async addBalance(userId: string, updateBalanceDto: UpdateBalanceDto): Promise<WalletEntity> {
    const wallet = await this.findByUserId(userId);
    const newBalance = wallet.balance + updateBalanceDto.amount;
    
    await this.walletRepository.update(wallet.id, { balance: newBalance });
    
    return this.findByUserId(userId);
  }

  async setBalance(userId: string, updateBalanceDto: UpdateBalanceDto): Promise<WalletEntity> {
    const wallet = await this.findByUserId(userId);
    
    await this.walletRepository.update(wallet.id, { balance: updateBalanceDto.amount });
    
    return this.findByUserId(userId);
  }
}