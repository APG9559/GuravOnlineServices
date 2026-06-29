import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('passkeys')
export class Passkey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  credentialID: string; // Base64url encoded credential ID for easy querying

  @Column({ type: 'bytea' })
  publicKey: Buffer; // Cryptographic public key stored as binary

  @Column({ type: 'integer', default: 0 })
  counter: number;

  @Column({ nullable: true })
  deviceType?: string; // 'singleDevice' or 'multiDevice'

  @Column({ default: false })
  backedUp: boolean;

  @Column('simple-array', { nullable: true })
  transports?: string[];

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;
}
