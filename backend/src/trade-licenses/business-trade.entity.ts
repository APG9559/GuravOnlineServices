import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Business } from './business.entity';

@Entity('business_trades')
export class BusinessTrade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Business, (b) => b.trades, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ length: 150 })
  tradeType: string;

  @Column({ length: 150 })
  tradeSubtype: string;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
