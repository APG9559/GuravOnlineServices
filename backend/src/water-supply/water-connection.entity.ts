import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn, Index, OneToMany,
} from 'typeorm';
import { Customer } from '../customers/customer.entity';
import { User } from '../users/user.entity';
import { WaterServiceRecord } from './water-service-record.entity';

@Entity('water_connections')
export class WaterConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_water_connections_conn_no_partial', { unique: true, where: '"connectionNo" IS NOT NULL AND "deletedAt" IS NULL' })
  @Column({ length: 100, nullable: true })
  connectionNo: string | null;

  @Column({ length: 150 })
  currentOwner: string;

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer | null;

  @Column({ type: 'text' })
  connectionAddress: string;

  @Column({ length: 150, nullable: true })
  contactPersonName: string | null;

  @Column({ length: 20, nullable: true })
  contactPersonPhone: string | null;

  @Column({ length: 100 })
  currentUsage: string; // e.g. Domestic, Commercial

  @Column({ length: 50, default: 'Pending' })
  connectionStatus: 'Pending' | 'Active' | 'Disconnected' | 'Cancelled';

  @Column({ type: 'text', nullable: true })
  meterDetails: string | null;

  @OneToMany(() => WaterServiceRecord, (record) => record.connection)
  serviceRecords: WaterServiceRecord[];

  @ManyToOne(() => User, { eager: true, nullable: false })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
