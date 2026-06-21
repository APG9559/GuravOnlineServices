import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Business } from './business.entity';
import { Affidavit } from '../affidavits/affidavit.entity';
import { PropertyCard } from '../property-cards/property-card.entity';
import { ShopActLicense } from '../shop-act-licenses/shop-act-license.entity';

@Entity('trade_license_records')
export class TradeLicenseRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  serviceType: 'New' | 'Renew' | 'Transfer_Heir' | 'Transfer_Third_Party' | 'Name_Change' | 'Trade_Change' | 'Partner_Change' | 'Cancel';

  @Index()
  @Column({ type: 'date' })
  dateOfService: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amountCharged: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  officialFee: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  serviceFee: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  protocolFee: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  miscFee: number | null;

  @Column({ length: 50, nullable: true })
  tokenNo: string | null;

  @Column({ type: 'jsonb', nullable: true })
  details: any;

  @ManyToOne(() => Business, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @ManyToOne(() => User, { eager: true, nullable: false })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @ManyToOne(() => Affidavit, { nullable: true, onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'linked_affidavit_id' })
  linkedAffidavit: Affidavit | null;

  @ManyToOne(() => PropertyCard, { nullable: true, onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'linked_property_card_id' })
  linkedPropertyCard: PropertyCard | null;

  @ManyToOne(() => ShopActLicense, { nullable: true, onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'linked_shop_act_id' })
  linkedShopAct: ShopActLicense | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
