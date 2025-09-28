import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';

export enum NotificationType {
  LOAN_CREATED = 'loan_created',
  LOAN_APPROVED = 'loan_approved',
  LOAN_REJECTED = 'loan_rejected',
  LOAN_COMPLETED = 'loan_completed',
  LOAN_OVERDUE = 'loan_overdue',
  PAYMENT_DUE = 'payment_due',
  SYSTEM = 'system'
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read'
}

@Entity('notification')
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'type', type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'message', type: 'text' })
  message: string;

  @Column({ name: 'status', type: 'enum', enum: NotificationStatus, default: NotificationStatus.UNREAD })
  status: NotificationStatus;

  @Column({ name: 'reference_id', type: 'varchar', length: 255, nullable: true })
  referenceId: string;

  @Column({ name: 'metadata', type: 'json', nullable: true })
  metadata: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}