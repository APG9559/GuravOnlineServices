import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { WaterServiceRecord } from './water-service-record.entity';

@Entity('water_payments')
export class WaterPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 50 })
  paymentMode: string; // Cash, UPI, Cheque, Bank Transfer, Card, Wallet

  @Column({ type: 'date' })
  paymentDate: string;

  @Column({ length: 100 })
  account: string; // Target account name

  @Column({ length: 100, nullable: true })
  referenceNumber: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => WaterServiceRecord, (record) => record.payments, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'record_id' })
  record: WaterServiceRecord;

  @ManyToOne(() => User, { eager: true, nullable: false })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
