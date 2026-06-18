import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Customer } from '../customers/customer.entity';

@Entity('shop_act_licenses')
export class ShopActLicense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  customerName: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ length: 255 })
  businessName: string;

  @Column({ length: 150, nullable: true })
  email: string;

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
