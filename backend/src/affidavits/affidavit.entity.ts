import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { PaperType, AuthorizerType } from '../common/enums/index';
import { User } from '../users/user.entity';

@Entity('affidavits')
export class Affidavit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  customerName: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ length: 255 })
  purpose: string;

  @Column({ type: 'enum', enum: PaperType })
  paperType: PaperType;

  @Column({ type: 'enum', enum: AuthorizerType })
  authorizerType: AuthorizerType;

  @Column({ length: 150, nullable: true })
  authorizerName: string;

  @Column({ type: 'date' })
  dateOfService: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amountCharged: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true, default: null })
  notaryPublicFee: number | null;

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
