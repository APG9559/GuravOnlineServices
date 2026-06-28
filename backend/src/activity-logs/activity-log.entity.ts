import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn, Index
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 100 })
  action: string; // e.g., 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'

  @Index()
  @Column({ length: 100, nullable: true })
  module: string; // e.g., 'affidavits', 'expenses', 'auth'

  @Column({ length: 255, nullable: true })
  recordId: string; // ID of the affected resource

  @Column({ type: 'jsonb', nullable: true })
  details: any; // Extra information: old/new values, IP, browser, etc.

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Index()
  @CreateDateColumn()
  createdAt: Date;
}
