import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index,
  ManyToMany,
} from 'typeorm';
import { Business } from '../trade-licenses/business.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 150 })
  name: string;

  @Index({ unique: true })
  @Column({ length: 20, unique: true, nullable: true })
  phone: string | null;

  @Column({ length: 255, nullable: true })
  address: string | null;

  @Column({ length: 150, nullable: true })
  email: string | null;

  @ManyToMany(() => Business, (business) => business.customers)
  businesses: Business[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
