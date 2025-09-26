import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { LoanEntity } from '../../loans/entities/loan.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  PARTIAL = 'partial'
}

export enum TransactionType {
  PAYMENT = 'payment',
  LATE_FEE = 'late_fee',
  PENALTY = 'penalty',
  REFUND = 'refund'
}

@Entity('loan_history')
export class LoanHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LoanEntity, loan => loan.histories)
  @JoinColumn({ name: 'loan_id' })
  loan: LoanEntity;

  @Column({ name: 'loan_id', type: 'uuid' })
  loanId: string;

  @Column({ name: 'transaction_type', type: 'enum', enum: TransactionType })
  transactionType: TransactionType;

  @Column({ name: 'amount', type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ name: 'due_date', type: 'timestamp' })
  dueDate: Date;

  @Column({ name: 'paid_date', type: 'timestamp', nullable: true })
  paidDate: Date;

  @Column({ name: 'status', type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'remaining_balance', type: 'decimal', precision: 15, scale: 2, nullable: true })
  remainingBalance: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}