import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { CreateUserDto, UpdateUserDto } from './users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({ ...dto, passwordHash });
    return this.userRepo.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
      user.isFirstLogin = true;
    }
    Object.assign(user, { name: dto.name ?? user.name, role: dto.role ?? user.role, isActive: dto.isActive ?? user.isActive, signature: dto.signature ?? user.signature });
    return this.userRepo.save(user);
  }

  async updatePasswordAndClearFirstLogin(id: string, password: string): Promise<User> {
    const user = await this.findOne(id);
    user.passwordHash = await bcrypt.hash(password, 10);
    user.isFirstLogin = false;
    return this.userRepo.save(user);
  }

  async updateProfile(id: string, name?: string, signature?: string): Promise<User> {
    const user = await this.findOne(id);
    if (name !== undefined) user.name = name;
    if (signature !== undefined) user.signature = signature;
    return this.userRepo.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepo.remove(user);
  }
}
