import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm';
import { Role } from '../common/enums';
import { Exclude } from 'class-transformer';
import { Passkey } from '../auth/passkey.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 150 })
  email: string;

  @Column()
  @Exclude()
  passwordHash: string;

  @Column({ type: 'enum', enum: Role, default: Role.OPERATOR })
  role: Role;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  isFirstLogin: boolean;

  @Column({ type: 'text', nullable: true })
  signature?: string;

  @OneToMany(() => Passkey, (passkey) => passkey.user)
  passkeys: Passkey[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
