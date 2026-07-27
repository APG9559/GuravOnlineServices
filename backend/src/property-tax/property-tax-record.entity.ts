import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn, OneToMany, Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Property } from './property.entity';
import { PropertyTaxPayment } from './property-tax-payment.entity';

@Entity('property_tax_service_records')
@Index('idx_ptax_records_dos_active', ['dateOfService'], { where: '"deletedAt" IS NULL' })
export class PropertyTaxRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  serviceType: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  officialFee: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  serviceFee: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  protocolFee: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amountCharged: number;

  @Column({ type: 'jsonb', nullable: true })
  details: any;

  @Index()
  @Column({ type: 'date' })
  dateOfService: string;

  @Index()
  @ManyToOne(() => Property, (p) => p.records, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @OneToMany(() => PropertyTaxPayment, (p) => p.record, { cascade: true })
  payments: PropertyTaxPayment[];

  @Index()
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
