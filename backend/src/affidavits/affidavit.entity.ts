import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { PaperType, AuthorizerType } from '../common/enums/index';
import { User } from '../users/user.entity';
import { Customer } from '../customers/customer.entity';

@Entity('affidavits')
export class Affidavit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 150 })
  customerName: string;

  @Index()
  @Column({ length: 20 })
  phone: string;

  @Column({ length: 255 })
  purpose: string;

  @Column({ length: 100, nullable: true, default: null })
  affidavitNo: string | null;

  @Column({ type: 'enum', enum: PaperType })
  paperType: PaperType;

  @Column({ type: 'enum', enum: AuthorizerType })
  authorizerType: AuthorizerType;

  @Column({ length: 150, nullable: true })
  authorizerName: string;

  @Index()
  @Column({ type: 'date' })
  dateOfService: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amountCharged: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true, default: null })
  notaryPublicFee: number | null;

  @Column({ length: 255, nullable: true, default: null })
  remark: string | null;

  @Column({ type: 'boolean', default: false })
  customerBroughtStamp: boolean;

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
