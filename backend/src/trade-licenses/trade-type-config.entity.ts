import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
} from 'typeorm';

@Entity('trade_type_configs')
export class TradeTypeConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  tradeType: string;

  @Column({ length: 150 })
  tradeSubtype: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  officialFee: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
