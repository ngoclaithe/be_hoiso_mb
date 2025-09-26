import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanHistoryService } from './loan-history.service';
import { LoanHistoryController } from './loan-history.controller';
import { LoanHistoryEntity } from './entities/loan-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LoanHistoryEntity])],
  controllers: [LoanHistoryController],
  providers: [LoanHistoryService],
  exports: [LoanHistoryService],
})
export class LoanHistoryModule {}