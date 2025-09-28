import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { WalletEntity } from '../../wallet/entities/wallet.entity';

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('transactions')
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WalletEntity)
  @JoinColumn({ name: 'wallet_id' })
  wallet: WalletEntity;

  @Column({ name: 'wallet_id', type: 'uuid' })
  walletId: string;

  @Column({ 
    name: 'type', 
    type: 'enum', 
    enum: TransactionType 
  })
  type: TransactionType;

  @Column({ 
    name: 'amount', 
    type: 'decimal', 
    precision: 15, 
    scale: 2 
  })
  amount: number;

  @Column({ 
    name: 'status', 
    type: 'enum', 
    enum: TransactionStatus,
    default: TransactionStatus.PENDING
  })
  status: TransactionStatus;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'reference_id', type: 'varchar', nullable: true })
  referenceId?: string;

  @Column({ name: 'balance_before', type: 'decimal', precision: 15, scale: 2 })
  balanceBefore: number;

  @Column({ name: 'balance_after', type: 'decimal', precision: 15, scale: 2 })
  balanceAfter: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @CreateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}