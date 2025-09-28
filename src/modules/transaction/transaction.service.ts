import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TransactionEntity, TransactionType, TransactionStatus } from './entities/transaction.entity';
import { WalletService } from '../wallet/wallet.service';
import { DepositDto, WithdrawTransactionDto } from './dto/transaction.dto';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(TransactionEntity)
    private transactionRepository: Repository<TransactionEntity>,
    private walletService: WalletService,
    private dataSource: DataSource,
  ) {}

  async deposit(userId: string, depositDto: DepositDto): Promise<TransactionEntity> {
    console.log('=== TRANSACTION DEPOSIT START ===');
    console.log('Deposit params:', { userId, ...depositDto });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get current wallet balance
      const wallet = await this.walletService.findByUserId(userId);
      const balanceBefore = this.toNumber(wallet.balance);
      
      console.log('Wallet before deposit:', { 
        walletId: wallet.id, 
        balanceBefore,
        depositAmount: depositDto.amount 
      });

      // Create transaction record with PENDING status
      const transaction = this.transactionRepository.create({
        walletId: wallet.id,
        type: TransactionType.DEPOSIT,
        amount: depositDto.amount,
        status: TransactionStatus.PENDING,
        description: depositDto.description,
        referenceId: depositDto.referenceId,
        balanceBefore: balanceBefore,
        balanceAfter: balanceBefore + depositDto.amount,
      });

      const savedTransaction = await queryRunner.manager.save(TransactionEntity, transaction);
      console.log('Transaction created:', { id: savedTransaction.id, status: savedTransaction.status });

      // Update wallet balance
      await this.walletService.addBalance(userId, { amount: depositDto.amount });
      
      // Update transaction status to COMPLETED
      await queryRunner.manager.update(TransactionEntity, savedTransaction.id, { 
        status: TransactionStatus.COMPLETED 
      });

      await queryRunner.commitTransaction();
      
      console.log('=== TRANSACTION DEPOSIT COMPLETED ===');
      
      // Return updated transaction
      return this.findById(savedTransaction.id);

    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Deposit transaction failed:', error);
      
      // Update transaction status to FAILED if transaction was created
      try {
        const failedTransaction = await this.transactionRepository.findOne({
          where: { 
            walletId: (await this.walletService.findByUserId(userId)).id,
            status: TransactionStatus.PENDING 
          },
          order: { createdAt: 'DESC' }
        });
        
        if (failedTransaction) {
          await this.transactionRepository.update(failedTransaction.id, { 
            status: TransactionStatus.FAILED 
          });
        }
      } catch (updateError) {
        console.error('Failed to update transaction status:', updateError);
      }

      throw new InternalServerErrorException('Deposit transaction failed');
    } finally {
      await queryRunner.release();
    }
  }

  async withdraw(userId: string, withdrawDto: WithdrawTransactionDto): Promise<TransactionEntity> {
    console.log('=== TRANSACTION WITHDRAW START ===');
    console.log('Withdraw params:', { userId, ...withdrawDto });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get current wallet balance
      const wallet = await this.walletService.findByUserId(userId);
      const balanceBefore = this.toNumber(wallet.balance);
      
      console.log('Wallet before withdraw:', { 
        walletId: wallet.id, 
        balanceBefore,
        withdrawAmount: withdrawDto.amount 
      });

      // Check sufficient balance
      if (balanceBefore < withdrawDto.amount) {
        throw new BadRequestException(
          `Insufficient balance. Current: ${balanceBefore}, Requested: ${withdrawDto.amount}`
        );
      }

      // Create transaction record with PENDING status
      const transaction = this.transactionRepository.create({
        walletId: wallet.id,
        type: TransactionType.WITHDRAW,
        amount: withdrawDto.amount,
        status: TransactionStatus.PENDING,
        description: withdrawDto.description,
        referenceId: withdrawDto.referenceId,
        balanceBefore: balanceBefore,
        balanceAfter: balanceBefore - withdrawDto.amount,
      });

      const savedTransaction = await queryRunner.manager.save(TransactionEntity, transaction);
      console.log('Transaction created:', { id: savedTransaction.id, status: savedTransaction.status });

      // Update wallet balance
      await this.walletService.withdraw(userId, { amount: withdrawDto.amount });
      
      // Update transaction status to COMPLETED
      await queryRunner.manager.update(TransactionEntity, savedTransaction.id, { 
        status: TransactionStatus.COMPLETED 
      });

      await queryRunner.commitTransaction();
      
      console.log('=== TRANSACTION WITHDRAW COMPLETED ===');
      
      // Return updated transaction
      return this.findById(savedTransaction.id);

    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Withdraw transaction failed:', error);
      
      // Update transaction status to FAILED if transaction was created
      try {
        const failedTransaction = await this.transactionRepository.findOne({
          where: { 
            walletId: (await this.walletService.findByUserId(userId)).id,
            status: TransactionStatus.PENDING 
          },
          order: { createdAt: 'DESC' }
        });
        
        if (failedTransaction) {
          await this.transactionRepository.update(failedTransaction.id, { 
            status: TransactionStatus.FAILED 
          });
        }
      } catch (updateError) {
        console.error('Failed to update transaction status:', updateError);
      }

      // Re-throw the original error if it's a BadRequestException
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Withdraw transaction failed');
    } finally {
      await queryRunner.release();
    }
  }

  async findById(id: string): Promise<TransactionEntity> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['wallet']
    });

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    return transaction;
  }

  async getTransactionHistory(userId: string, limit: number = 20, offset: number = 0): Promise<{
    transactions: TransactionEntity[];
    total: number;
  }> {
    const wallet = await this.walletService.findByUserId(userId);
    
    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: { walletId: wallet.id },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['wallet']
    });

    return { transactions, total };
  }

  async getTransactionsByType(
    userId: string, 
    type: TransactionType,
    limit: number = 20,
    offset: number = 0
  ): Promise<{
    transactions: TransactionEntity[];
    total: number;
  }> {
    const wallet = await this.walletService.findByUserId(userId);
    
    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: { 
        walletId: wallet.id,
        type: type
      },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['wallet']
    });

    return { transactions, total };
  }

  private toNumber(value: any): number {
    if (typeof value === 'number') {
      return value;
    }
    
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^\d.-]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
}