import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToMany, JoinTable, Index, OneToMany,
} from 'typeorm';
import { Customer } from '../customers/customer.entity';
import { BusinessTrade } from './business-trade.entity';

@Entity('businesses')
export class Business {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 255 })
  name: string;

  @Index()
  @Column({ length: 100, nullable: true })
  licenseNo: string | null;

  // Legacy columns kept for migration — will be removed after data migration
  @Column({ length: 150, nullable: true })
  tradeType: string | null;

  @Column({ length: 150, nullable: true })
  tradeSubtype: string | null;

  @Column({ length: 150, nullable: true })
  email: string | null;

  @Column({ length: 50, nullable: true })
  phone: string | null;

  @Column({ length: 50, default: 'Pending' })
  status: 'Pending' | 'Approved' | 'Cancelled';

  @Column({ type: 'int', nullable: true })
  lastRenewalYear: number | null;

  @Column({ type: 'varchar', length: 50, default: 'Not Available' })
  completionCertificateStatus: 'Available' | 'Not Available';

  @Column({ type: 'date', nullable: true })
  completionCertificateSubmittedAt: Date | null;

  @Column({ type: 'varchar', length: 50, default: 'Not_Submitted' })
  completionCertificateVerificationStatus: 'Not_Submitted' | 'Pending' | 'Verified' | 'Rejected';

  @Column({ type: 'date', nullable: true })
  completionCertificateVerifiedAt: Date | null;

  @Column({ type: 'boolean', default: true })
  isTenant: boolean;

  @Column({ type: 'boolean', default: false })
  depositFeeCharged: boolean;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  depositFeeAmount: number;

  @Column({ type: 'date', nullable: true })
  depositFeeCollectionDate: Date | null;

  @OneToMany(() => BusinessTrade, (bt) => bt.business, { eager: true, cascade: true })
  trades: BusinessTrade[];

  @ManyToMany(() => Customer, (customer) => customer.businesses)
  @JoinTable({
    name: 'business_customers',
    joinColumn: { name: 'business_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'customer_id', referencedColumnName: 'id' },
  })
  customers: Customer[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
