import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Customer } from '../customers/customer.entity';

@Entity('property_tax_records')
export class PropertyTax {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  serviceType: string; // 'AssessmentCopy' | 'NameTransfer' | 'NoDuesCertificate'

  @Column({ length: 150 })
  customerName: string; // Applicant Name

  @Column({ length: 20, nullable: true })
  phone: string | null; // Mobile No

  @Column({ type: 'text' })
  address: string; // Address

  @Column({ length: 100 })
  propertyTaxNo: string; // Property Tax No.

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  officialFee: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  serviceFee: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  protocolFee: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amountCharged: number; // Total

  @Index()
  @Column({ type: 'date' })
  dateOfService: string;

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
