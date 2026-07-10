import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from "typeorm";
import { User } from "../users/user.entity";
import { WaterConnection } from "./water-connection.entity";
import { WaterPayment } from "./water-payment.entity";
import { WaterDocument } from "./water-document.entity";

@Entity("water_service_records")
export class WaterServiceRecord {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 50 })
  serviceType:
    | "NewConnection"
    | "ConnectionTransfer"
    | "MeterDisconnection"
    | "MeterReconnection"
    | "ChangeOfUse"
    | "MeterInspection"
    | "NoDuesCertificate";

  @Index()
  @Column({ type: "date" })
  dateOfService: string;

  @Column({ type: "date" })
  applicationDate: string;

  @Index({ unique: true, where: '"applicationTokenNo" IS NOT NULL' })
  @Column({ length: 100, nullable: true })
  applicationTokenNo: string | null;

  @Column({ type: "numeric", precision: 10, scale: 2 })
  officialFee: number;

  @Column({ type: "numeric", precision: 10, scale: 2 })
  serviceFee: number;

  @Column({ type: "numeric", precision: 10, scale: 2, nullable: true })
  protocolFee: number | null;

  @Column({ type: "numeric", precision: 10, scale: 2, nullable: true })
  miscFee: number | null;

  @Column({ type: "numeric", precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: "numeric", precision: 10, scale: 2 })
  amountCharged: number; // Total amount charged: officialFee + serviceFee + protocolFee + miscFee - discount

  @Column({ type: "text", nullable: true })
  remarks: string | null;

  @Column({ type: "json", nullable: true })
  details: any | null; // Stores service-specific inputs like plumber, transfer type, usage, etc.

  @ManyToOne(() => WaterConnection, (connection) => connection.serviceRecords, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "connection_id" })
  connection: WaterConnection;

  @OneToMany(() => WaterPayment, (payment) => payment.record, { cascade: true })
  payments: WaterPayment[];

  @OneToMany(() => WaterDocument, (document) => document.serviceRecord, {
    cascade: true,
  })
  documents: WaterDocument[];

  @ManyToOne(() => User, { eager: true, nullable: false })
  @JoinColumn({ name: "created_by" })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
