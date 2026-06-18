import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn, ManyToMany, JoinTable,
} from 'typeorm';
import { MarriageAct } from '../common/enums/index';
import { User } from '../users/user.entity';
import { Affidavit } from '../affidavits/affidavit.entity';

@Entity('marriages')
export class Marriage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  contactName: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ length: 150, nullable: true })
  contactEmail: string;

  @Column({ length: 255, nullable: true })
  address: string;

  @Column({ length: 150 })
  spouse1Name: string;

  @Column({ length: 150 })
  spouse2Name: string;

  @Column({ type: 'enum', enum: MarriageAct })
  marriageAct: MarriageAct;

  @Column({ type: 'date' })
  marriageDate: string;

  @Column({ length: 255, nullable: true })
  marriagePlace: string;

  @Column({ length: 150, nullable: true })
  witness1Name: string;

  @Column({ length: 150, nullable: true })
  witness2Name: string;

  @Column({ length: 150, nullable: true })
  witness3Name: string;

  @Column({ length: 255, nullable: true })
  priestDetails: string;

  @Column({ type: 'date' })
  dateOfService: string;

  @Column({ type: 'simple-array', nullable: true })
  servicesProvided: string[];

  @ManyToMany(() => Affidavit, { eager: true })
  @JoinTable({ name: 'marriage_affidavits' })
  affidavits: Affidavit[];

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
