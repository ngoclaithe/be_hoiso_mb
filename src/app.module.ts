import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { LoansModule } from './modules/loans/loans.module';
import { LoanHistoryModule } from './modules/loan-history/loan-history.module';
import { LoggerService } from './common/logger/logger.service';
import { UserEntity } from './modules/users/entities/user.entity';
import { LoanEntity } from './modules/loans/entities/loan.entity';
import { LoanHistoryEntity } from './modules/loan-history/entities/loan-history.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 3306),
        username: configService.get('DB_USERNAME', 'root'),
        password: configService.get('DB_PASSWORD', ''),
        database: configService.get('DB_DATABASE', 'loan_system'),
        entities: [UserEntity, LoanEntity, LoanHistoryEntity],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    LoansModule,
    LoanHistoryModule,
  ],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class AppModule {}