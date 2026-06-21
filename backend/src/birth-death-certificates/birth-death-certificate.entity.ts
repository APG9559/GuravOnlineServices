import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { CertificateType } from '../common/enums/index';
import { User } from '../users/user.entity';
import { Customer } from '../customers/customer.entity';

@Entity('birth_death_certificates')
export class BirthDeathCertificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: CertificateType })
  certificateType: CertificateType;

  @Column({ length: 150 })
  customerName: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ length: 150 })
  personName: string;

  @Column({ type: 'date' })
  eventDate: string;

  @Index()
  @Column({ type: 'date' })
  dateOfService: string;

  @Column({ type: 'int', default: 1 })
  numberOfCopies: number;

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
  deletedAt: Date;
}
