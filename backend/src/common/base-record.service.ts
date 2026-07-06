import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { CustomersService } from '../customers/customers.service';
import { ServiceMetricsResult } from './interfaces/service-metrics.interface';

export abstract class BaseRecordService<T> {
  constructor(
    protected readonly repo: Repository<T>,
    protected readonly customersService: CustomersService,
    protected readonly entityName: string,
  ) {}

  async findAll(
    filter: { from?: string; to?: string; search?: string },
    searchFields: string[] = ['customerName', 'phone'],
    customizeQb?: (qb: any) => void,
  ): Promise<T[]> {
    const qb = this.repo.createQueryBuilder('entity')
      .leftJoinAndSelect('entity.createdBy', 'u')
      .leftJoinAndSelect('entity.customer', 'c')
      .orderBy('entity.dateOfService', 'DESC')
      .addOrderBy('entity.createdAt', 'DESC');

    if (filter.from) {
      qb.andWhere('entity.dateOfService >= :from', { from: filter.from });
    }
    if (filter.to) {
      qb.andWhere('entity.dateOfService <= :to', { to: filter.to });
    }

    if (filter.search) {
      const conditions = searchFields.map((field, idx) => {
        if (field.includes('.')) {
          return `LOWER(${field}) LIKE :s_${idx}`;
        }
        return `LOWER(entity.${field}) LIKE :s_${idx} OR entity.${field} LIKE :s_${idx}`;
      }).join(' OR ');

      const params: Record<string, string> = {};
      searchFields.forEach((_, idx) => {
        params[`s_${idx}`] = `%${filter.search!.toLowerCase()}%`;
      });

      qb.andWhere(`(${conditions})`, params);
    }

    if (customizeQb) {
      customizeQb(qb);
    }

    return qb.getMany();
  }

  async create(dto: any, user: User): Promise<T> {
    const address = dto.connectionAddress || dto.address || null;
    const email = dto.email || dto.contactEmail || null;
    let customer = null;
    if (dto.phone) {
      customer = await this.customersService.upsertByPhone(
        dto.customerName,
        dto.phone,
        address,
        email,
      );
    }
    const record = this.repo.create({ ...dto, createdBy: user, customer } as any);
    return this.repo.save(record as any) as Promise<T>;
  }

  async findOne(id: string): Promise<T> {
    const rec = await this.repo.findOne({
      where: { id } as any,
      relations: ['createdBy', 'customer'],
    });
    if (!rec) throw new NotFoundException(`${this.entityName} not found`);
    return rec;
  }

  async update(id: string, dto: any): Promise<T> {
    const rec = await this.findOne(id);
    Object.assign(rec, dto);

    let phone = (rec as any).phone;
    if (dto.phone !== undefined) {
      phone = dto.phone;
    }
    const customerName = dto.customerName || (rec as any).customerName;
    const address = dto.connectionAddress || dto.address || (rec as any).connectionAddress || (rec as any).address || null;
    const email = dto.email || dto.contactEmail || (rec as any).email || (rec as any).contactEmail || null;

    if (phone && customerName) {
      const customer = await this.customersService.upsertByPhone(customerName, phone, address, email);
      (rec as any).customer = customer;
    } else if (!phone) {
      (rec as any).customer = null;
    }

    return this.repo.save(rec as any) as Promise<T>;
  }

  async softDelete(id: string): Promise<void> {
    const rec = await this.findOne(id);
    await this.repo.softRemove(rec);
  }

  async getDashboardMetricsGeneric(
    from: string,
    to: string,
    options: {
      key: string;
      label: string;
      category: 'KMC' | 'CSC' | 'AapleSarkar';
      isExpense?: boolean;
      calculateGross?: (item: T) => number;
      calculateNet?: (item: T) => number;
      extraGroups?: {
        field: string;
        key: string;
      }[];
      customizeQb?: (qb: any) => void;
    },
  ): Promise<ServiceMetricsResult> {
    const possibleFields = [
      'id',
      'dateOfService',
      'amountCharged',
      'amount',
      'officialFee',
      'courtFeeTickets',
      'createdAt',
    ];

    if (options.extraGroups) {
      for (const eg of options.extraGroups) {
        possibleFields.push(eg.field);
      }
    }

    if (options.key === 'affidavits') {
      possibleFields.push('customerBroughtStamp');
      possibleFields.push('paperType');
      possibleFields.push('authorizerType');
      possibleFields.push('notaryPublicFee');
    }

    // Filter out columns that don't exist on the database table for this entity
    const selectFields = possibleFields
      .filter(field => this.repo.metadata.columns.some(col => col.propertyName === field))
      .map(field => `entity.${field}`);

    // Always select creator relation fields
    selectFields.push('u.id', 'u.name');

    const qb = this.repo.createQueryBuilder('entity')
      .leftJoin('entity.createdBy', 'u')
      .select(selectFields)
      .where('entity.dateOfService >= :from AND entity.dateOfService <= :to', { from, to });

    if (options.customizeQb) {
      options.customizeQb(qb);
    }

    const records = await qb.getMany();

    let count = 0;
    let gross = 0;
    let net = 0;
    const dailyMap = new Map<string, number>();
    const userMap = new Map<string, { userId: string; userName: string; gross: number; net: number }>();
    const extraMaps = options.extraGroups?.map(g => ({
      field: g.field,
      key: g.key,
      map: new Map<string, number>()
    })) || [];

    for (const r of records as any[]) {
      count++;
      const grossVal = options.calculateGross ? options.calculateGross(r) : Number(r.amountCharged || r.amount || 0);
      gross += grossVal;

      const netVal = options.calculateNet ? options.calculateNet(r) : grossVal;
      net += netVal;

      const dateStr = r.dateOfService instanceof Date ? r.dateOfService.toISOString().split('T')[0] : String(r.dateOfService).split('T')[0];
      dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + netVal);

      const uid = r.createdBy?.id || 'unknown';
      const uname = r.createdBy?.name || 'Unknown User';
      if (!userMap.has(uid)) {
        userMap.set(uid, { userId: uid, userName: uname, gross: 0, net: 0 });
      }
      const userStat = userMap.get(uid)!;
      userStat.gross += grossVal;
      userStat.net += netVal;

      // Extra groups
      for (const eg of extraMaps) {
        const val = r[eg.field];
        if (val) {
          eg.map.set(val, (eg.map.get(val) || 0) + 1);
        }
      }
    }

    const daily = Array.from(dailyMap.entries()).map(([date, net]) => ({ date, net }));
    const userBreakdown = Array.from(userMap.values());

    const extra: any = {};
    for (const eg of extraMaps) {
      extra[eg.key] = Array.from(eg.map.entries()).map(([name, count]) => ({ [eg.field]: name, count }));
    }

    const result: any = {
      key: options.key,
      label: options.label,
      category: options.category,
      count,
      gross,
      net,
      daily,
      userBreakdown,
      isExpense: options.isExpense,
    };

    if (options.extraGroups && options.extraGroups.length > 0) {
      result.extra = extra;
    }

    return result;
  }
}
