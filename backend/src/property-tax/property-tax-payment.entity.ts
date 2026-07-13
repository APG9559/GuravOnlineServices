import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { PropertyTaxRecord } from './property-tax-record.entity';

@Entity('property_tax_payments')
export class PropertyTaxPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 50 })
  paymentMode: string;

  @Column({ type: 'date' })
  paymentDate: string;

  @Column({ length: 100 })
  account: string;

  @Column({ length: 100, nullable: true })
  referenceNumber: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => PropertyTaxRecord, (r) => r.payments, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'record_id' })
  record: PropertyTaxRecord;

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
