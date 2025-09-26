import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CccdService } from './cccd.service';
import { CccdController } from './cccd.controller';
import { CccdEntity } from './entities/cccd.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CccdEntity])],
  controllers: [CccdController],
  providers: [CccdService],
  exports: [CccdService],
})
export class CccdModule {}