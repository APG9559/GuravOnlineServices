import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { CustomersService } from '../customers/customers.service';
import { ServiceMetricsResult } from './interfaces/service-metrics.interface';

export function formatDateString(val: any): string {
  if (!val) return '';
  if (val instanceof Date) {
    const year = val.getFullYear();
    const month = String(val.getMonth() + 1).padStart(2, '0');
    const day = String(val.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const str = String(val);
  return str.includes('T') ? str.split('T')[0] : str.substring(0, 10);
}

export abstract class BaseRecordService<T> {
  constructor(
    protected readonly repo: Repository<T>,
    protected readonly customersService: CustomersService,
    protected readonly entityName: string,
  ) {}

  protected resolveCustomerFields(dto: any): { name?: string; phone?: string; address?: string; email?: string } | null {
    const address = dto.connectionAddress || dto.address || null;
    const email = dto.email || dto.contactEmail || null;
    if (dto.customerName) {
      return { name: dto.customerName, phone: dto.phone || null, address, email };
    }
    return null;
  }

  protected getFindOneRelations(): string[] {
    const relations: string[] = [];
    const hasCreatedBy = this.repo.metadata.relations.some((r) => r.propertyName === 'createdBy');
    if (hasCreatedBy) relations.push('createdBy');

    const hasUser = this.repo.metadata.relations.some((r) => r.propertyName === 'user');
    if (hasUser) relations.push('user');

    const hasCustomer = this.repo.metadata.relations.some((r) => r.propertyName === 'customer');
    if (hasCustomer) relations.push('customer');

    return relations;
  }

  async findAll(
    filter: { from?: string; to?: string; search?: string; page?: number; limit?: number },
    searchFields: string[] = ['customerName', 'phone'],
    customizeQb?: (qb: any) => void,
  ): Promise<any> {
    const qb = this.repo.createQueryBuilder('entity');

    const hasCreatedByRelation = this.repo.metadata.relations.some(
      (relation) => relation.propertyName === 'createdBy'
    );
    if (hasCreatedByRelation) {
      qb.leftJoinAndSelect('entity.createdBy', 'u');
    } else {
      const hasUserRelation = this.repo.metadata.relations.some(
        (relation) => relation.propertyName === 'user'
      );
      if (hasUserRelation) {
        qb.leftJoinAndSelect('entity.user', 'u');
      }
    }

    const hasCustomerRelation = this.repo.metadata.relations.some(
      (relation) => relation.propertyName === 'customer'
    );
    if (hasCustomerRelation) {
      qb.leftJoinAndSelect('entity.customer', 'c');
    }

    qb.orderBy('entity.dateOfService', 'DESC')
      .addOrderBy('entity.createdAt', 'DESC');

    if (customizeQb) {
      customizeQb(qb);
    }

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

    if (filter.page && filter.limit) {
      const page = Math.max(Number(filter.page) || 1, 1);
      const rawLimit = Number(filter.limit) || 20;
      const limit = Math.min(Math.max(rawLimit, 1), 100);
      
      const countQb = qb.clone();
      const [records, total] = await Promise.all([
        qb.take(limit).skip((page - 1) * limit).getMany(),
        countQb.getCount(),
      ]);

      return {
        records,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    return qb.take(100).getMany();
  }

  async create(dto: any, user: User): Promise<T> {
    const fields = this.resolveCustomerFields(dto);
    let customer = null;
    if (fields?.name) {
      customer = await this.customersService.upsertByPhone(
        fields.name, fields.phone || null, fields.address, fields.email,
      );
    }
    const record = this.repo.create({ ...dto, createdBy: user, customer } as any);
    return this.repo.save(record as any) as Promise<T>;
  }

  async findOne(id: string): Promise<T> {
    const relations = this.getFindOneRelations();
    const rec = await this.repo.findOne({
      where: { id } as any,
      relations,
    });
    if (!rec) throw new NotFoundException(`${this.entityName} not found`);
    return rec;
  }

  async update(id: string, dto: any): Promise<T> {
    const rec = await this.findOne(id);
    Object.assign(rec, dto);

    const hasCustomerRelation = this.repo.metadata.relations.some(
      (relation) => relation.propertyName === 'customer'
    );
    if (hasCustomerRelation) {
      const current: any = rec;
      const fields = this.resolveCustomerFields(current);

      if (fields?.name) {
        const customer = await this.customersService.upsertByPhone(fields.name, fields.phone || null, fields.address, fields.email);
        current.customer = customer;
      } else {
        current.customer = null;
      }
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
      netExpression?: string;
      grossExpression?: string;
      calculateGross?: (item: T) => number;
      calculateNet?: (item: T) => number;
      extraGroups?: {
        field: string;
        key: string;
      }[];
      customizeQb?: (qb: any) => void;
    },
  ): Promise<ServiceMetricsResult> {
    const testQb = this.repo.createQueryBuilder('entity');
    const isFullQb = typeof (testQb as any).addSelect === 'function' && typeof (testQb as any).getRawOne === 'function';

    if (options.netExpression && isFullQb) {
      const hasAmountCharged = this.repo.metadata.columns.some((c) => c.propertyName === 'amountCharged');
      const hasAmount = this.repo.metadata.columns.some((c) => c.propertyName === 'amount');
      const defaultGrossColumn = hasAmountCharged ? '"entity"."amountCharged"' : (hasAmount ? '"entity"."amount"' : '0');
      const grossExpr = options.grossExpression || `COALESCE(${defaultGrossColumn}, 0)`;
      const netExpr = options.netExpression;

      const userRel = this.repo.metadata.relations.find(
        (r) => r.propertyName === 'createdBy' || r.propertyName === 'user' || r.propertyName === 'sentBy'
      );

      const totalsQb = this.repo.createQueryBuilder('entity')
        .select('COUNT(entity.id)', 'count')
        .addSelect(`COALESCE(SUM(${grossExpr}), 0)`, 'gross')
        .addSelect(`COALESCE(SUM(${netExpr}), 0)`, 'net')
        .where('entity.dateOfService >= :from AND entity.dateOfService <= :to', { from, to });

      const dailyQb = this.repo.createQueryBuilder('entity')
        .select('entity.dateOfService', 'date')
        .addSelect(`COALESCE(SUM(${netExpr}), 0)`, 'net')
        .where('entity.dateOfService >= :from AND entity.dateOfService <= :to', { from, to })
        .groupBy('entity.dateOfService')
        .orderBy('entity.dateOfService', 'ASC');

      const userQb = this.repo.createQueryBuilder('entity');
      if (userRel) {
        userQb.leftJoin(`entity.${userRel.propertyName}`, 'u')
          .select("COALESCE(u.id::text, 'unknown')", 'userId')
          .addSelect("COALESCE(u.name, 'Unknown User')", 'userName')
          .groupBy('u.id')
          .addGroupBy('u.name');
      } else {
        userQb.select("'unknown'", 'userId')
          .addSelect("'Unknown User'", 'userName');
      }
      userQb.addSelect(`COALESCE(SUM(${grossExpr}), 0)`, 'gross')
        .addSelect(`COALESCE(SUM(${netExpr}), 0)`, 'net')
        .where('entity.dateOfService >= :from AND entity.dateOfService <= :to', { from, to });

      const extraQueries = (options.extraGroups || []).map((eg) => {
        const eqb = this.repo.createQueryBuilder('entity')
          .select(`entity.${eg.field}`, 'name')
          .addSelect('COUNT(entity.id)', 'count')
          .where('entity.dateOfService >= :from AND entity.dateOfService <= :to', { from, to })
          .groupBy(`entity.${eg.field}`);
        return eqb.getRawMany().then((rows) => ({
          key: eg.key,
          field: eg.field,
          rows,
        }));
      });

      const [totalsRaw, dailyRaw, userRaw, ...extraRaw] = await Promise.all([
        totalsQb.getRawOne(),
        dailyQb.getRawMany(),
        userQb.getRawMany(),
        ...extraQueries,
      ]);

      const count = Number(totalsRaw?.count || 0);
      const gross = Number(totalsRaw?.gross || 0);
      const net = Number(totalsRaw?.net || 0);

      const daily = dailyRaw.map((r: any) => ({
        date: formatDateString(r.date),
        net: Number(r.net || 0),
      }));

      const userBreakdown = userRaw.map((r: any) => ({
        userId: r.userId,
        userName: r.userName,
        gross: Number(r.gross || 0),
        net: Number(r.net || 0),
      }));

      const extra: any = {};
      for (const item of extraRaw) {
        extra[item.key] = item.rows
          .filter((r: any) => r.name)
          .map((r: any) => ({ [item.field]: r.name, count: Number(r.count || 0) }));
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
    const cols = this.repo?.metadata?.columns;
    const selectFields = cols
      ? possibleFields
          .filter(field => cols.some(col => col.propertyName === field))
          .map(field => `entity.${field}`)
      : possibleFields.map(field => `entity.${field}`);

    // Always select creator relation fields
    selectFields.push('u.id', 'u.name');

    const qb = this.repo.createQueryBuilder('entity');

    const relations = this.repo?.metadata?.relations || [];
    const userRel = relations.find(
      (r) => r.propertyName === 'createdBy' || r.propertyName === 'user' || r.propertyName === 'sentBy'
    );
    if (userRel) {
      qb.leftJoin(`entity.${userRel.propertyName}`, 'u');
    }

    qb.select(selectFields)
      .where('entity.dateOfService >= :from AND entity.dateOfService <= :to', { from, to });

    if (options.customizeQb) {
      options.customizeQb(qb);
    }

    const rawRecords = await qb.getRawMany();

    const records = rawRecords.map((r) => {
      const obj: any = {};
      for (const key of Object.keys(r)) {
        if (key.startsWith('entity_')) {
          obj[key.substring(7)] = r[key];
        } else if (key.startsWith('u_')) {
          if (!obj.createdBy) obj.createdBy = {};
          obj.createdBy[key.substring(2)] = r[key];
        } else {
          obj[key] = r[key];
        }
      }
      return obj;
    });

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

    for (const r of records) {
      count++;
      const grossVal = options.calculateGross ? options.calculateGross(r) : Number(r.amountCharged || r.amount || 0);
      gross += grossVal;

      const netVal = options.calculateNet ? options.calculateNet(r) : grossVal;
      net += netVal;

      const dateStr = formatDateString(r.dateOfService);
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
