import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { LoanHistoryEntity } from '../../loan-history/entities/loan-history.entity';

export enum LoanStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  OVERDUE = 'overdue'
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other'
}

@Entity('loan')
export class LoanEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, user => user.loans)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  // Personal Information
  @Column({ name: 'full_name', type: 'varchar', length: 255 })
  fullName: string;

  @Column({ name: 'current_address', type: 'text' })
  currentAddress: string;

  @Column({ name: 'permanent_address', type: 'text' })
  permanentAddress: string;

  @Column({ name: 'hometown', type: 'text' })
  hometown: string;

  @Column({ name: 'citizen_id', type: 'varchar', length: 20, unique: true })
  citizenId: string;

  @Column({ name: 'citizen_id_front_url', type: 'text', nullable: true })
  citizenIdFrontUrl: string;

  @Column({ name: 'citizen_id_back_url', type: 'text', nullable: true })
  citizenIdBackUrl: string;

  @Column({ name: 'personal_signature_url', type: 'text', nullable: true })
  personalSignatureUrl: string;

  @Column({ name: 'contract_code', type: 'varchar', length: 8, nullable: true })
  contractCode: string;

  @Column({ name: 'portrait_url', type: 'text', nullable: true })
  portraitUrl: string;
  
  @Column({ name: 'gender', type: 'enum', enum: Gender })
  gender: Gender;

  @Column({ name: 'date_of_birth', type: 'date' })
  dateOfBirth: Date;

  @Column({ name: 'occupation', type: 'varchar', length: 255 })
  occupation: string;

  @Column({ name: 'income', type: 'decimal', precision: 15, scale: 2 })
  income: number;

  @Column({ name: 'loan_purpose', type: 'text' })
  loanPurpose: string;

  // Emergency Contacts
  @Column({ name: 'contact_1_phone', type: 'varchar', length: 20 })
  contact1Phone: string;

  @Column({ name: 'contact_1_relationship', type: 'varchar', length: 100 })
  contact1Relationship: string;

  @Column({ name: 'contact_2_phone', type: 'varchar', length: 20 })
  contact2Phone: string;

  @Column({ name: 'contact_2_relationship', type: 'varchar', length: 100 })
  contact2Relationship: string;

  // Bank Information
  @Column({ name: 'bank_account_number', type: 'varchar', length: 50 })
  bankAccountNumber: string;

  @Column({ name: 'bank_name', type: 'varchar', length: 255 })
  bankName: string;

  @Column({ name: 'account_holder_name', type: 'varchar', length: 255 })
  accountHolderName: string;

  // Loan Details
  @Column({ name: 'loan_amount', type: 'decimal', precision: 15, scale: 2 })
  loanAmount: number;

  @Column({ name: 'loan_term_months', type: 'int' })
  loanTermMonths: number;

  @Column({ name: 'interest_rate', type: 'decimal', precision: 5, scale: 2 })
  interestRate: number;

  // Important Dates
  @Column({ name: 'approved_date', type: 'timestamp', nullable: true })
  approvedDate: Date;

  @Column({ name: 'due_date', type: 'timestamp', nullable: true })
  dueDate: Date;

  @Column({ name: 'settlement_date', type: 'timestamp', nullable: true })
  settlementDate: Date;

  @Column({ name: 'monthly_payment_date', type: 'int', default: 1 })
  monthlyPaymentDate: number;

  @Column({ name: 'status', type: 'enum', enum: LoanStatus, default: LoanStatus.PENDING })
  status: LoanStatus;

  @OneToMany(() => LoanHistoryEntity, history => history.loan)
  histories: LoanHistoryEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}