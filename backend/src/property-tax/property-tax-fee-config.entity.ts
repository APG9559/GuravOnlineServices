import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
} from 'typeorm';

@Entity('property_tax_fee_configs')
export class PropertyTaxFeeConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  serviceType: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  officialFee: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  serviceFee: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  protocolFee: number;

  @Column({ type: 'boolean', default: true })
  allowManualOverride: boolean;

  @Column({ type: 'date', nullable: true })
  effectiveDate: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
