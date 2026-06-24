import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn, ManyToMany, JoinTable, Index,
} from 'typeorm';
import { MarriageAct } from '../common/enums/index';
import { User } from '../users/user.entity';
import { Affidavit } from '../affidavits/affidavit.entity';
import { Customer } from '../customers/customer.entity';

@Entity('marriages')
export class Marriage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  contactName: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ length: 150, nullable: true })
  contactEmail: string;

  @Column({ length: 255, nullable: true })
  address: string;

  @Column({ type: 'boolean', default: true })
  isPrimaryContactSpouse: boolean;

  @Column({ length: 20, nullable: true })
  primaryContactSpouseType: string;

  @Column({ length: 150 })
  spouse1Name: string;

  @Column({ length: 150 })
  spouse2Name: string;

  @Column({ type: 'enum', enum: MarriageAct })
  marriageAct: MarriageAct;

  @Column({ type: 'date' })
  marriageDate: string;

  @Column({ length: 255, nullable: true })
  marriagePlace: string;

  @Column({ type: 'date', nullable: true })
  appointmentDate: string;

  @Index()
  @Column({ type: 'date' })
  dateOfService: string;

  @Column({ type: 'simple-array', nullable: true })
  servicesProvided: string[];

  @ManyToMany(() => Affidavit, { eager: true })
  @JoinTable({ name: 'marriage_affidavits' })
  affidavits: Affidavit[];

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amountCharged: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  officialFee: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  courtFeeTickets: number;

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
