import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { CccdModule } from './modules/cccd/cccd.module';
import { LoansModule } from './modules/loans/loans.module';
import { LoanHistoryModule } from './modules/loan-history/loan-history.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { LoggerService } from './common/logger/logger.service';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    CloudinaryModule,
    CccdModule,
    LoansModule,
    LoanHistoryModule,
    AuthModule,
    UsersModule,
    WalletModule,
    NotificationsModule,
  ],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class AppModule {}