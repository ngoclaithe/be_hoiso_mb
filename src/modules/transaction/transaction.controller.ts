import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
  ParseEnumPipe,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { DepositDto, WithdrawTransactionDto } from './dto/transaction.dto';
import { TransactionType } from './entities/transaction.entity';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('deposit/:userId')
  @HttpCode(HttpStatus.CREATED)
  async deposit(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() depositDto: DepositDto,
  ) {
    const transaction = await this.transactionService.deposit(userId, depositDto);
    
    return {
      success: true,
      message: 'Deposit completed successfully',
      data: {
        transaction: {
          id: transaction.id,
          type: transaction.type,
          amount: transaction.amount,
          status: transaction.status,
          balanceBefore: transaction.balanceBefore,
          balanceAfter: transaction.balanceAfter,
          description: transaction.description,
          referenceId: transaction.referenceId,
          createdAt: transaction.createdAt,
        }
      }
    };
  }

  @Post('withdraw/:userId')
  @HttpCode(HttpStatus.CREATED)
  async withdraw(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() withdrawDto: WithdrawTransactionDto,
  ) {
    const transaction = await this.transactionService.withdraw(userId, withdrawDto);
    
    return {
      success: true,
      message: 'Withdrawal completed successfully',
      data: {
        transaction: {
          id: transaction.id,
          type: transaction.type,
          amount: transaction.amount,
          status: transaction.status,
          balanceBefore: transaction.balanceBefore,
          balanceAfter: transaction.balanceAfter,
          description: transaction.description,
          referenceId: transaction.referenceId,
          createdAt: transaction.createdAt,
        }
      }
    };
  }

  @Get('history/:userId')
  async getTransactionHistory(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
    @Query('offset', new ParseIntPipe({ optional: true })) offset: number = 0,
  ) {
    const result = await this.transactionService.getTransactionHistory(userId, limit, offset);
    
    return {
      success: true,
      data: {
        transactions: result.transactions.map(transaction => ({
          id: transaction.id,
          type: transaction.type,
          amount: transaction.amount,
          status: transaction.status,
          balanceBefore: transaction.balanceBefore,
          balanceAfter: transaction.balanceAfter,
          description: transaction.description,
          referenceId: transaction.referenceId,
          createdAt: transaction.createdAt,
        })),
        pagination: {
          total: result.total,
          limit: limit,
          offset: offset,
          hasMore: offset + limit < result.total,
        }
      }
    };
  }

  @Get('history/:userId/type/:type')
  async getTransactionsByType(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('type', new ParseEnumPipe(TransactionType)) type: TransactionType,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
    @Query('offset', new ParseIntPipe({ optional: true })) offset: number = 0,
  ) {
    const result = await this.transactionService.getTransactionsByType(userId, type, limit, offset);
    
    return {
      success: true,
      data: {
        transactions: result.transactions.map(transaction => ({
          id: transaction.id,
          type: transaction.type,
          amount: transaction.amount,
          status: transaction.status,
          balanceBefore: transaction.balanceBefore,
          balanceAfter: transaction.balanceAfter,
          description: transaction.description,
          referenceId: transaction.referenceId,
          createdAt: transaction.createdAt,
        })),
        pagination: {
          total: result.total,
          limit: limit,
          offset: offset,
          hasMore: offset + limit < result.total,
        }
      }
    };
  }

  @Get(':id')
  async getTransactionById(@Param('id', ParseUUIDPipe) id: string) {
    const transaction = await this.transactionService.findById(id);
    
    return {
      success: true,
      data: {
        transaction: {
          id: transaction.id,
          type: transaction.type,
          amount: transaction.amount,
          status: transaction.status,
          balanceBefore: transaction.balanceBefore,
          balanceAfter: transaction.balanceAfter,
          description: transaction.description,
          referenceId: transaction.referenceId,
          createdAt: transaction.createdAt,
          wallet: {
            id: transaction.wallet.id,
            userId: transaction.wallet.userId,
            balance: transaction.wallet.balance,
          }
        }
      }
    };
  }
}