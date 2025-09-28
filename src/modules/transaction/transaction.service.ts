import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TransactionEntity, TransactionType, TransactionStatus } from './entities/transaction.entity';
import { WalletEntity } from '../wallet/entities/wallet.entity';
import { WalletService } from '../wallet/wallet.service';
import { DepositDto, WithdrawTransactionDto } from './dto/transaction.dto';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(TransactionEntity)
    private transactionRepository: Repository<TransactionEntity>,
    @InjectRepository(WalletEntity)
    private walletRepository: Repository<WalletEntity>,
    private walletService: WalletService,
    private dataSource: DataSource,
  ) { }

  async deposit(userId: string, depositDto: DepositDto): Promise<TransactionEntity> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const wallet = await queryRunner.manager.findOne(WalletEntity, {
        where: { userId },
        lock: { mode: 'pessimistic_write' }
      });

      if (!wallet) {
        throw new BadRequestException(`Wallet not found for user: ${userId}`);
      }

      const balanceBefore = this.toNumber(wallet.balance);
      const balanceAfter = balanceBefore + depositDto.amount;

      const transactionData = {
        walletId: wallet.id,
        type: TransactionType.DEPOSIT,
        amount: depositDto.amount,
        status: TransactionStatus.PENDING,
        description: depositDto.description,
        balanceBefore: balanceBefore,
        balanceAfter: balanceAfter,
      };

      const transaction = queryRunner.manager.create(TransactionEntity, transactionData);
      const savedTransaction = await queryRunner.manager.save(TransactionEntity, transaction);

      await queryRunner.manager.update(WalletEntity, wallet.id, {
        balance: balanceAfter
      });

      await queryRunner.manager.update(TransactionEntity, savedTransaction.id, {
        status: TransactionStatus.COMPLETED
      });

      await queryRunner.commitTransaction();

      return await this.findById(savedTransaction.id);

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(`Deposit transaction failed: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async withdraw(userId: string, withdrawDto: WithdrawTransactionDto): Promise<TransactionEntity> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const wallet = await queryRunner.manager.findOne(WalletEntity, {
        where: { userId },
        lock: { mode: 'pessimistic_write' }
      });

      if (!wallet) {
        throw new BadRequestException(`Wallet not found for user: ${userId}`);
      }

      const balanceBefore = this.toNumber(wallet.balance);

      if (balanceBefore < withdrawDto.amount) {
        throw new BadRequestException(`Insufficient balance. Current: ${balanceBefore}, Requested: ${withdrawDto.amount}`);
      }

      const balanceAfter = balanceBefore - withdrawDto.amount;

      const transactionData = {
        walletId: wallet.id,
        type: TransactionType.WITHDRAW,
        amount: withdrawDto.amount,
        status: TransactionStatus.PENDING,
        description: withdrawDto.description,
        balanceBefore: balanceBefore,
        balanceAfter: balanceAfter,
      };

      const transaction = queryRunner.manager.create(TransactionEntity, transactionData);
      const savedTransaction = await queryRunner.manager.save(TransactionEntity, transaction);

      await queryRunner.manager.update(WalletEntity, wallet.id, {
        balance: balanceAfter
      });

      await queryRunner.commitTransaction();

      return await this.findById(savedTransaction.id);

    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(`Withdraw transaction failed: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

async approveWithdraw(transactionId: string, adminId?: string): Promise<TransactionEntity> {
  const queryRunner = this.dataSource.createQueryRunner();

  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Load transaction với pessimistic lock (không có relations)
    const transaction = await queryRunner.manager.findOne(TransactionEntity, {
      where: { id: transactionId },
      lock: { mode: 'pessimistic_write' }
    });

    if (!transaction) {
      throw new BadRequestException(`Transaction not found: ${transactionId}`);
    }

    if (transaction.type !== TransactionType.WITHDRAW) {
      throw new BadRequestException(`Only withdraw transactions can be approved`);
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException(`Transaction is not in pending status`);
    }

    // Update transaction status
    await queryRunner.manager.update(TransactionEntity, transactionId, {
      status: TransactionStatus.COMPLETED,
    });

    await queryRunner.commitTransaction();

    return await this.findById(transactionId);

  } catch (error) {
    await queryRunner.rollbackTransaction();

    if (error instanceof BadRequestException) {
      throw error;
    }

    throw new InternalServerErrorException(`Approve withdraw failed: ${error.message}`);
  } finally {
    await queryRunner.release();
  }
}
async rejectWithdraw(transactionId: string, reason?: string, adminId?: string): Promise<TransactionEntity> {
  const queryRunner = this.dataSource.createQueryRunner();

  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Load transaction với pessimistic lock (không có relations)
    const transaction = await queryRunner.manager.findOne(TransactionEntity, {
      where: { id: transactionId },
      lock: { mode: 'pessimistic_write' }
    });

    if (!transaction) {
      throw new BadRequestException(`Transaction not found: ${transactionId}`);
    }

    if (transaction.type !== TransactionType.WITHDRAW) {
      throw new BadRequestException(`Only withdraw transactions can be rejected`);
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException(`Transaction is not in pending status`);
    }

    // Load wallet với pessimistic lock
    const wallet = await queryRunner.manager.findOne(WalletEntity, {
      where: { id: transaction.walletId },
      lock: { mode: 'pessimistic_write' }
    });

    if (wallet) {
      const currentBalance = this.toNumber(wallet.balance);
      const refundBalance = currentBalance + transaction.amount;

      await queryRunner.manager.update(WalletEntity, wallet.id, {
        balance: refundBalance
      });
    }

    // Update transaction status
    await queryRunner.manager.update(TransactionEntity, transactionId, {
      status: TransactionStatus.FAILED,
      description: reason ? `${transaction.description} - Rejected: ${reason}` : `${transaction.description} - Rejected`
    });

    await queryRunner.commitTransaction();

    return await this.findById(transactionId);

  } catch (error) {
    await queryRunner.rollbackTransaction();

    if (error instanceof BadRequestException) {
      throw error;
    }

    throw new InternalServerErrorException(`Reject withdraw failed: ${error.message}`);
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
      throw new BadRequestException(`Transaction not found for ID: ${id}`);
    }

    return transaction;
  }

  async findByIdAndUserId(id: string, userId: string): Promise<TransactionEntity> {
    const wallet = await this.walletService.findByUserId(userId);

    const transaction = await this.transactionRepository.findOne({
      where: {
        id,
        walletId: wallet.id
      },
      relations: ['wallet']
    });

    if (!transaction) {
      throw new BadRequestException(`Transaction not found or access denied`);
    }

    return transaction;
  }

async getTransactionHistory(
  userId?: string, 
  limit: number = 20, 
  offset: number = 0,
  isAdmin: boolean = false
): Promise<{
  transactions: TransactionEntity[];
  total: number;
}> {
  if (isAdmin) {
    const [transactions, total] = await this.transactionRepository.findAndCount({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['wallet']
    });

    return { transactions, total };
  }

  if (!userId) {
    throw new BadRequestException('User ID is required for non-admin users');
  }

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

  async getPendingWithdrawals(limit: number = 20, offset: number = 0): Promise<{
    transactions: TransactionEntity[];
    total: number;
  }> {
    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: {
        type: TransactionType.WITHDRAW,
        status: TransactionStatus.PENDING
      },
      order: { createdAt: 'ASC' },
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