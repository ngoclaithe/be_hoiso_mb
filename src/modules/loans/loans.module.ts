import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoansService } from './loans.service';
import { LoansController } from './loans.controller';
import { LoanEntity } from './entities/loan.entity';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoanEntity]),
    forwardRef(() => WalletModule),
    NotificationsModule,
  ],
  controllers: [LoansController],
  providers: [LoansService],
  exports: [LoansService],
})
export class LoansModule {}