import {
  Entity, PrimaryColumn, Column, UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('pricing_settings')
export class PricingSetting {
  @PrimaryColumn({ length: 60 })
  key: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  value: number;

  @Column({ length: 120 })
  label: string;

  @Column({ length: 60 })
  group: string;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy: User | null;
}
