import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { WaterServiceRecord } from './water-service-record.entity';

@Entity('water_documents')
export class WaterDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  documentType: string;

  @Column({ type: 'text' })
  fileName: string;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @ManyToOne(() => WaterServiceRecord, (record) => record.documents, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'record_id' })
  serviceRecord: WaterServiceRecord;

  @ManyToOne(() => User, { eager: true, nullable: false })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
