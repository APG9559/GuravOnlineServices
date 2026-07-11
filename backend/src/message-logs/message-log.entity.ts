import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('message_logs')
export class MessageLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 100 })
  module: string; // e.g. 'tradeLicenses', 'marriages', 'affidavits'

  @Column({ length: 100, nullable: true })
  templateId: string | null; // e.g. 'tl_renewal_reminder'

  @Column({ length: 200, nullable: true })
  templateLabel: string | null; // e.g. 'Renewal Reminder'

  @Index()
  @Column({ length: 20 })
  channel: string; // 'whatsapp' | 'sms'

  @Column({ length: 255, nullable: true })
  recipientName: string | null;

  @Index()
  @Column({ length: 30 })
  recipientPhone: string;

  @Column({ type: 'text' })
  messageBody: string;

  @Column({ length: 255, nullable: true })
  recordId: string | null; // ID of the source record (service log, receipt, etc.)

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'sent_by_id' })
  sentBy: User | null;

  @Index()
  @CreateDateColumn()
  createdAt: Date;
}
