import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Customer } from '../customers/customer.entity';

@Entity('water_supply_records')
export class WaterSupply {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  serviceType: string; // e.g. 'NewConnection', 'ConnectionTransfer', 'MeterDisconnection', etc.

  @Column({ length: 150 })
  customerName: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ type: 'text' })
  connectionAddress: string;

  @Column({ length: 100 })
  applicationTokenNo: string;

  @Column({ type: 'date' })
  applicationDate: string;

  @Column({ type: 'date' })
  dateOfService: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  officialFee: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  serviceFee: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amountCharged: number; // Total

  // Specific conditional fields
  @Column({ length: 150, nullable: true })
  plumberName: string | null;

  @Column({ length: 20, nullable: true })
  plumberPhone: string | null;

  @Column({ length: 150, nullable: true })
  contactPersonName: string | null;

  @Column({ length: 20, nullable: true })
  contactPersonPhone: string | null;

  @Column({ length: 100, nullable: true })
  connectionNo: string | null;

  @Column({ length: 150, nullable: true })
  currentOwner: string | null;

  @Column({ length: 150, nullable: true })
  newOwnerName: string | null;

  @Column({ length: 20, nullable: true })
  newOwnerPhone: string | null;

  @Column({ length: 50, nullable: true })
  transferSubtype: string | null; // Purchase, Inheritance, GiftDeed, SubDivision

  @Column({ length: 100, nullable: true })
  currentUsage: string | null;

  @Column({ length: 100, nullable: true })
  newUsage: string | null;

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
  deletedAt: Date;
}
