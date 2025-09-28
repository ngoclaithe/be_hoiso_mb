import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { TransactionEntity } from './entities/transaction.entity';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TransactionEntity]),
    WalletModule,
  ],
  controllers: [TransactionController],
  providers: [TransactionService],
  exports: [TransactionService], 
})
export class TransactionModule {}