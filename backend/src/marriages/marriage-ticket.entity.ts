import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn, OneToOne, OneToMany, Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Marriage } from './marriage.entity';
import { MarriagePayment } from './marriage-payment.entity';

export enum TicketStatus {
  INQUIRED = 'Inquired',
  CONFIRMED = 'Confirmed',
  COMPLETED = 'Completed',
}

@Entity('marriage_tickets')
export class MarriageTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => MarriagePayment, (payment) => payment.ticket)
  payments: MarriagePayment[];

  @Index()
  @Column({ length: 20, unique: true })
  ticketNumber: string;

  @Index()  
  @Column({ length: 150 })
  contactName: string;

  @Index()
  @Column({ length: 20, nullable: true })
  phone: string | null;

  @Column({ length: 255, nullable: true })
  contactEmail: string;

  @Column({ length: 500, nullable: true })
  address: string;

  @Column({ type: 'boolean', default: true })
  isPrimaryContactSpouse: boolean;

  @Column({ length: 20, nullable: true })
  primaryContactSpouseType: string;

  @Column({ type: 'simple-array', nullable: true })
  servicesProvided: string[];

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amountCharged: number;

  @Column({ type: 'jsonb' })
  questionnaireData: Record<string, any>;

  @Index()
  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.INQUIRED })
  status: TicketStatus;

  @OneToOne(() => Marriage, { nullable: true, eager: false })
  @JoinColumn({ name: 'marriage_id' })
  marriage: Marriage | null;

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
