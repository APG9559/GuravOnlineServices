import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Customer } from '../customers/customer.entity';

@Entity('passport_records')
export class PassportRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  customerName: string;

  @Column({ length: 20, nullable: true })
  phone: string | null;

  @Column({ length: 50 })
  applicationType: 'Fresh' | 'Re-issue';

  @Column({ length: 100, nullable: true })
  fileNo: string | null;

  @Column({ type: 'date', nullable: true })
  appointmentDate: string | null;

  @Index()
  @Column({ type: 'date' })
  dateOfService: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  officialFee: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  serviceFee: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amountCharged: number;


  @ManyToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer | null;

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
