import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from './activity-log.entity';
import { User } from '../users/user.entity';

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly repo: Repository<ActivityLog>,
  ) {}

  async createLog(
    action: string,
    module: string,
    recordId: string | null,
    details: any | null,
    user: User | null,
  ): Promise<ActivityLog> {
    const log = this.repo.create({
      action,
      module,
      recordId,
      details,
      user,
    });
    return this.repo.save(log);
  }

  async findAll(limit = 100, offset = 0) {
    const [data, total] = await this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['user'],
    });

    return { data, total };
  }
}
