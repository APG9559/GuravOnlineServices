import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { MarriageTicket } from './marriage-ticket.entity';
import { Marriage } from './marriage.entity';

@Entity('marriage_payments')
export class MarriagePayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 50 })
  paymentMode: string;

  @Column({ length: 100 })
  account: string;

  @Column({ type: 'date' })
  paymentDate: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => MarriageTicket, (ticket) => ticket.payments, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ticket_id' })
  ticket: MarriageTicket | null;

  @ManyToOne(() => Marriage, (marriage) => marriage.payments, { nullable: true, onDelete: 'SET NULL' })
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
