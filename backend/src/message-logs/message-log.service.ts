import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, ILike, FindOptionsWhere } from 'typeorm';
import { MessageLog } from './message-log.entity';
import { CreateMessageLogDto } from './message-log.dto';
import { User } from '../users/user.entity';

@Injectable()
export class MessageLogService {
  constructor(
    @InjectRepository(MessageLog)
    private readonly repo: Repository<MessageLog>,
  ) {}

  async create(dto: CreateMessageLogDto, user: User | null): Promise<MessageLog> {
    const log = this.repo.create({
      module: dto.module,
      templateId: dto.templateId ?? null,
      templateLabel: dto.templateLabel ?? null,
      channel: dto.channel,
      recipientName: dto.recipientName ?? null,
      recipientPhone: dto.recipientPhone,
      messageBody: dto.messageBody,
      recordId: dto.recordId ?? null,
      sentBy: user,
    });
    return this.repo.save(log);
  }

  async findAll(query: {
    module?: string;
    channel?: string;
    phone?: string;
    name?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<MessageLog> = {};

    if (query.module) where.module = query.module;
    if (query.channel) where.channel = query.channel;
    if (query.phone) where.recipientPhone = ILike(`%${query.phone}%`);
    if (query.name) where.recipientName = ILike(`%${query.name}%`);
    if (query.from && query.to) {
      where.createdAt = Between(new Date(query.from), new Date(query.to + 'T23:59:59'));
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      skip,
      relations: ['sentBy'],
    });

    return { data, total, page, limit };
  }
}
