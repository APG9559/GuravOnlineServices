import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';

export abstract class BaseCaseService<TCase extends { id: string; status: string }> {
  constructor(
    protected readonly caseRepo: Repository<TCase>,
  ) {}

  async findAll(
    filter: { search?: string; page?: number; limit?: number },
    searchFields: string[],
  ): Promise<TCase[] | { records: TCase[]; total: number; page: number; limit: number; totalPages: number }> {
    const qb = this.caseRepo.createQueryBuilder('c')
      .leftJoinAndSelect('c.customer', 'cust')
      .orderBy('c.createdAt', 'DESC');

    if (filter.search) {
      const conditions = searchFields.map((f, i) =>
        `LOWER(c.${f}) LIKE :s_${i}`
      ).join(' OR ');

      const params: Record<string, string> = {};
      searchFields.forEach((_, i) => {
        params[`s_${i}`] = `%${filter.search!.toLowerCase()}%`;
      });

      qb.andWhere(`(${conditions})`, params);
    }

    if (filter.page && filter.limit) {
      const page = Number(filter.page);
      const limit = Number(filter.limit);
      const [records, total] = await qb
        .take(limit)
        .skip((page - 1) * limit)
        .getManyAndCount();

      return { records, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    return qb.take(500).getMany();
  }

  async findOne(id: string, relations: string[] = ['customer']): Promise<TCase> {
    const item = await this.caseRepo.findOne({
      where: { id } as any,
      relations,
    });
    if (!item) throw new NotFoundException('Record not found');
    return item;
  }

  async approve(
    id: string,
    identifier: string,
    identifierField: string,
    identifierLabel: string,
  ): Promise<TCase> {
    const item = await this.findOne(id);
    if (item.status === 'Approved') {
      throw new BadRequestException('Already approved');
    }

    const existing = await this.caseRepo.findOne({
      where: { [identifierField]: identifier } as any,
    });
    if (existing && existing.id !== id) {
      throw new BadRequestException(`${identifierLabel} "${identifier}" is already assigned`);
    }

    (item as any)[identifierField] = identifier;
    (item as any).status = 'Approved';
    return this.caseRepo.save(item);
  }

  async delete(id: string): Promise<void> {
    const item = await this.findOne(id);
    await this.caseRepo.softRemove(item);
  }
}
