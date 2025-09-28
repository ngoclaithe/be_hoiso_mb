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
  Request,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { DepositDto, WithdrawTransactionDto } from './dto/transaction.dto';
import { TransactionType } from './entities/transaction.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('deposit')
  @HttpCode(HttpStatus.CREATED)
  async deposit(@Request() req: any, @Body() depositDto: DepositDto) {
    const userId = req.user.id;
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
          createdAt: transaction.createdAt,
        }
      }
    };
  }

  @Post('withdraw')
  @HttpCode(HttpStatus.CREATED)
  async withdraw(@Request() req: any, @Body() withdrawDto: WithdrawTransactionDto) {
    const userId = req.user.id;
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
          createdAt: transaction.createdAt,
        }
      }
    };
  }

  @Get('history')
  async getTransactionHistory(
    @Request() req: any,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
    @Query('offset', new ParseIntPipe({ optional: true })) offset: number = 0,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role; // Giả sử role được lưu trong JWT payload
    const isAdmin = userRole === 'admin';
    
    const result = await this.transactionService.getTransactionHistory(
      userId, 
      limit, 
      offset, 
      isAdmin
    );
    
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
          createdAt: transaction.createdAt,
          // Chỉ hiện thông tin wallet cho admin
          ...(isAdmin && transaction.wallet && {
            wallet: {
              id: transaction.wallet.id,
              userId: transaction.wallet.userId,
              balance: transaction.wallet.balance,
            }
          })
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

  @Get('history/type/:type')
  async getTransactionsByType(
    @Request() req: any,
    @Param('type', new ParseEnumPipe(TransactionType)) type: TransactionType,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
    @Query('offset', new ParseIntPipe({ optional: true })) offset: number = 0,
  ) {
    const userId = req.user.id;
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



  // Admin endpoints - cần thêm AdminGuard
  @Post('admin/withdraw/:id/approve')
  @HttpCode(HttpStatus.OK)
  async approveWithdraw(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    const adminId = req.user?.id; // Có thể dùng để log ai approve
    const transaction = await this.transactionService.approveWithdraw(id, adminId);
    
    return {
      success: true,
      message: 'Withdraw request approved successfully',
      data: {
        transaction: {
          id: transaction.id,
          type: transaction.type,
          amount: transaction.amount,
          status: transaction.status,
          balanceBefore: transaction.balanceBefore,
          balanceAfter: transaction.balanceAfter,
          description: transaction.description,
          createdAt: transaction.createdAt,
        }
      }
    };
  }

  @Post('admin/withdraw/:id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectWithdraw(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reason?: string }
  ) {
    const adminId = req.user?.id; // Có thể dùng để log ai reject
    const transaction = await this.transactionService.rejectWithdraw(id, body.reason, adminId);
    
    return {
      success: true,
      message: 'Withdraw request rejected successfully',
      data: {
        transaction: {
          id: transaction.id,
          type: transaction.type,
          amount: transaction.amount,
          status: transaction.status,
          balanceBefore: transaction.balanceBefore,
          balanceAfter: transaction.balanceAfter,
          description: transaction.description,
          createdAt: transaction.createdAt,
        }
      }
    };
  }

  @Get('admin/pending-withdrawals')
  async getPendingWithdrawals(
    @Request() req: any,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
    @Query('offset', new ParseIntPipe({ optional: true })) offset: number = 0,
  ) {
    const result = await this.transactionService.getPendingWithdrawals(limit, offset);
    
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
          createdAt: transaction.createdAt,
          wallet: {
            id: transaction.wallet.id,
            userId: transaction.wallet.userId,
            balance: transaction.wallet.balance,
          }
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
  async getTransactionById(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    const userId = req.user.id;
    const transaction = await this.transactionService.findByIdAndUserId(id, userId);
    
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