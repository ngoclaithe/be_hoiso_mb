import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('cccd')
export class CccdEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'front_image_url', type: 'text', nullable: true })
  frontImageUrl: string;

  @Column({ name: 'back_image_url', type: 'text', nullable: true })
  backImageUrl: string;

  @Column({ name: 'cccd_number', type: 'varchar', length: 20, nullable: true })
  cccd: string;

  @Column({ name: 'full_name', type: 'varchar', length: 255, nullable: true })
  name: string;

  @Column({ name: 'hometown', type: 'varchar', length: 255, nullable: true })
  hometown: string;

  @Column({ name: 'current_address', type: 'text', nullable: true })
  currentAddress: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}