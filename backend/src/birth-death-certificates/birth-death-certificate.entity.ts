import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { CertificateType } from '../common/enums/index';
import { User } from '../users/user.entity';

@Entity('birth_death_certificates')
export class BirthDeathCertificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: CertificateType })
  certificateType: CertificateType;

  @Column({ length: 150 })
  customerName: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ length: 150 })
  personName: string;

  @Column({ type: 'date' })
  eventDate: string;

  @Column({ type: 'date' })
  dateOfService: string;

  @Column({ type: 'int', default: 1 })
  numberOfCopies: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amountCharged: number;

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
