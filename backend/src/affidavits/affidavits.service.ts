import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Affidavit } from './affidavit.entity';
import { CreateAffidavitDto, UpdateAffidavitDto, AffidavitFilterDto } from './affidavits.dto';
import { User } from '../users/user.entity';

@Injectable()
export class AffidavitsService {
  constructor(
    @InjectRepository(Affidavit)
    private readonly repo: Repository<Affidavit>,
  ) {}

  async create(dto: CreateAffidavitDto, user: User): Promise<Affidavit> {
    const record = this.repo.create({ ...dto, createdBy: user });
    return this.repo.save(record);
  }

  async findAll(filter: AffidavitFilterDto) {
    const qb = this.repo.createQueryBuilder('a')
      .leftJoinAndSelect('a.createdBy', 'u')
      .orderBy('a.dateOfService', 'DESC');

    if (filter.from) qb.andWhere('a.dateOfService >= :from', { from: filter.from });
    if (filter.to) qb.andWhere('a.dateOfService <= :to', { to: filter.to });
    if (filter.search) {
      qb.andWhere('(LOWER(a.customerName) LIKE :s OR a.phone LIKE :s)', {
        s: `%${filter.search.toLowerCase()}%`,
      });
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Affidavit> {
    const rec = await this.repo.findOne({ where: { id }, relations: ['createdBy'] });
    if (!rec) throw new NotFoundException('Affidavit not found');
    return rec;
  }

  async update(id: string, dto: UpdateAffidavitDto): Promise<Affidavit> {
    const rec = await this.findOne(id);
    Object.assign(rec, dto);
    return this.repo.save(rec);
  }

  async softDelete(id: string): Promise<void> {
    const rec = await this.findOne(id);
    await this.repo.softRemove(rec);
  }
}
