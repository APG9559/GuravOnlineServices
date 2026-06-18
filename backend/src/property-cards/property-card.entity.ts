import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { PropertyCardType } from '../common/enums';
import { User } from '../users/user.entity';
import { Customer } from '../customers/customer.entity';

@Entity('property_cards')
export class PropertyCard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  customerName: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ type: 'enum', enum: PropertyCardType })
  recordType: PropertyCardType;

  @Column({ length: 150 })
  propertyNumber: string;

  @Column({ type: 'date' })
  dateOfService: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amountCharged: number;

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer | null;

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
