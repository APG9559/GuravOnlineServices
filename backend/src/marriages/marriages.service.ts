import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Marriage } from './marriage.entity';
import { Affidavit } from '../affidavits/affidavit.entity';
import { CreateMarriageDto, UpdateMarriageDto, MarriageFilterDto } from './marriages.dto';
import { User } from '../users/user.entity';

@Injectable()
export class MarriagesService {
  constructor(
    @InjectRepository(Marriage)
    private readonly repo: Repository<Marriage>,
    @InjectRepository(Affidavit)
    private readonly affRepo: Repository<Affidavit>,
  ) {}

  async create(dto: CreateMarriageDto, user: User): Promise<Marriage> {
    const { affidavitIds, ...rest } = dto;

    const record = this.repo.create({ ...rest, createdBy: user });

    if (affidavitIds && affidavitIds.length > 0) {
      const affidavits = await this.affRepo.findBy({ id: In(affidavitIds) });
      if (affidavits.length !== affidavitIds.length) {
        throw new NotFoundException('Some linked affidavits were not found');
      }
      record.affidavits = affidavits;
    } else {
      record.affidavits = [];
    }

    return this.repo.save(record);
  }

  async findAll(filter: MarriageFilterDto) {
    const qb = this.repo.createQueryBuilder('m')
      .leftJoinAndSelect('m.createdBy', 'u')
      .leftJoinAndSelect('m.affidavits', 'aff')
      .leftJoinAndSelect('aff.createdBy', 'affUser')
      .orderBy('m.dateOfService', 'DESC');

    if (filter.from) qb.andWhere('m.dateOfService >= :from', { from: filter.from });
    if (filter.to) qb.andWhere('m.dateOfService <= :to', { to: filter.to });
    if (filter.search) {
      qb.andWhere(
        '(LOWER(m.contactName) LIKE :s OR m.phone LIKE :s OR LOWER(m.spouse1Name) LIKE :s OR LOWER(m.spouse2Name) LIKE :s)',
        { s: `%${filter.search.toLowerCase()}%` },
      );
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Marriage> {
    const rec = await this.repo.findOne({
      where: { id },
      relations: ['createdBy', 'affidavits', 'affidavits.createdBy'],
    });
    if (!rec) throw new NotFoundException('Marriage record not found');
    return rec;
  }

  async update(id: string, dto: UpdateMarriageDto): Promise<Marriage> {
    const rec = await this.findOne(id);
    const { affidavitIds, ...rest } = dto;
    Object.assign(rec, rest);

    if (affidavitIds !== undefined) {
      if (affidavitIds && affidavitIds.length > 0) {
        const affidavits = await this.affRepo.findBy({ id: In(affidavitIds) });
        if (affidavits.length !== affidavitIds.length) {
          throw new NotFoundException('Some linked affidavits were not found');
        }
        rec.affidavits = affidavits;
      } else {
        rec.affidavits = [];
      }
    }

    return this.repo.save(rec);
  }

  async softDelete(id: string): Promise<void> {
    const rec = await this.findOne(id);
    await this.repo.softRemove(rec);
  }
}
