import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn, OneToOne,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Marriage } from './marriage.entity';

export enum TicketStatus {
  INQUIRED = 'Inquired',
  CONFIRMED = 'Confirmed',
  COMPLETED = 'Completed',
}

@Entity('marriage_tickets')
export class MarriageTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20, unique: true })
  ticketNumber: string;

  @Column({ length: 150 })
  contactName: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ length: 255, nullable: true })
  contactEmail: string;

  @Column({ length: 500, nullable: true })
  address: string;

  @Column({ type: 'simple-array', nullable: true })
  servicesProvided: string[];

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amountCharged: number;

  @Column({ type: 'jsonb' })
  questionnaireData: Record<string, any>;

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
