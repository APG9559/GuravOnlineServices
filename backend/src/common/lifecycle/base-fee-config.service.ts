import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { CreateFeeConfigDto } from './dto/create-fee-config.dto';

export abstract class BaseFeeConfigService<TConfig extends { id: string }> {
  constructor(
    protected readonly configRepo: Repository<TConfig>,
  ) {}

  async findAll(): Promise<TConfig[]> {
    return this.configRepo.find({ order: { serviceType: 'ASC' } as any });
  }

  async create(dto: CreateFeeConfigDto): Promise<TConfig> {
    const config = this.configRepo.create(dto as any);
    return this.configRepo.save(config as any);
  }

  async update(id: string, dto: CreateFeeConfigDto): Promise<TConfig> {
    const config = await this.configRepo.findOne({ where: { id } as any });
    if (!config) throw new NotFoundException('Configuration not found');
    Object.assign(config, dto);
    return this.configRepo.save(config as any);
  }

  async delete(id: string): Promise<void> {
    const config = await this.configRepo.findOne({ where: { id } as any });
    if (!config) throw new NotFoundException('Configuration not found');
    await this.configRepo.softRemove(config);
  }
}
