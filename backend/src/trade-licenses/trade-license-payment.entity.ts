import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { TradeLicenseRecord } from './trade-license-record.entity';

@Entity('trade_license_payments')
export class TradeLicensePayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 50 })
  paymentMode: string;

  @Column({ length: 100 })
  account: string;

  @Column({ type: 'date' })
  paymentDate: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => TradeLicenseRecord, (record) => record.payments, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'record_id' })
  record: TradeLicenseRecord;

  @ManyToOne(() => User, { eager: true, nullable: false })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
