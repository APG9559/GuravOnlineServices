import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToMany, JoinTable,
} from 'typeorm';
import { Customer } from '../customers/customer.entity';

@Entity('businesses')
export class Business {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 100, nullable: true })
  licenseNo: string | null;

  @Column({ length: 150, nullable: true })
  tradeType: string | null;

  @Column({ length: 150, nullable: true })
  tradeSubtype: string | null;

  @Column({ length: 150, nullable: true })
  email: string | null;

  @Column({ length: 50, nullable: true })
  phone: string | null;

  @Column({ length: 50, default: 'Pending' })
  status: 'Pending' | 'Approved' | 'Cancelled';

  @Column({ type: 'int', nullable: true })
  lastRenewalYear: number | null;

  @ManyToMany(() => Customer, (customer) => customer.businesses)
  @JoinTable({
    name: 'business_customers',
    joinColumn: { name: 'business_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'customer_id', referencedColumnName: 'id' },
  })
  customers: Customer[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
