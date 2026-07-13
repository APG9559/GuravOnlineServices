import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from './property.entity';
import { PropertyTaxRecord } from './property-tax-record.entity';
import { PropertyTaxPayment } from './property-tax-payment.entity';
import { PropertyTaxFeeConfig } from './property-tax-fee-config.entity';
import {
  CreatePropertyTaxRecordDto,
  UpdatePropertyTaxRecordDto,
  CreatePropertyTaxPaymentDto,
  CreatePropertyTaxFeeConfigDto,
  PropertyTaxFilterDto,
} from './property-tax.dto';
import { User } from '../users/user.entity';
import { CustomersService } from '../customers/customers.service';
import { BaseRecordService } from '../common/base-record.service';
import { IDashboardMetrics, ServiceMetricsResult } from '../common/interfaces/service-metrics.interface';
import { ICustomerHistoryProvider, CustomerHistoryItem } from '../common/interfaces/customer-history.interface';

export function flattenPropertyTaxRecord(record: PropertyTaxRecord): any {
  if (!record) return record;
  const property = record.property || {} as any;
  const details = record.details || {};

  return {
    ...record,
    customerName: property.customer?.name || details.customerName || null,
    phone: property.customer?.phone || details.phone || null,
    address: property.address || null,
    propertyTaxNo: property.propertyTaxNo || null,
  };
}

@Injectable()
export class PropertyTaxService
  extends BaseRecordService<PropertyTaxRecord>
  implements IDashboardMetrics, ICustomerHistoryProvider, OnModuleInit
{
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepo: Repository<Property>,

    @InjectRepository(PropertyTaxRecord)
    private readonly recordRepo: Repository<PropertyTaxRecord>,

    @InjectRepository(PropertyTaxPayment)
    private readonly paymentRepo: Repository<PropertyTaxPayment>,

    @InjectRepository(PropertyTaxFeeConfig)
    private readonly configRepo: Repository<PropertyTaxFeeConfig>,

    customersService: CustomersService,
  ) {
    super(recordRepo, customersService, 'Property Tax record');
  }

  async onModuleInit() {
    await this.migrateLegacyData();
  }

  private async migrateLegacyData() {
    const queryRunner = this.recordRepo.manager.connection.createQueryRunner();
    const hasLegacyTable = await queryRunner.hasTable('property_tax_records');
    if (!hasLegacyTable) return;

    const propertyCount = await this.propertyRepo.count();
    if (propertyCount > 0) return;

    console.log('Migrating legacy property_tax_records...');
    try {
      const legacyRecords = await queryRunner.query('SELECT * FROM property_tax_records ORDER BY "createdAt" ASC');

      const propertyMap = new Map<string, Property>();
      for (const legacy of legacyRecords) {
        if (!propertyMap.has(legacy.propertyTaxNo)) {
          let customer = null;
          if (legacy.phone && legacy.customerName) {
            customer = await this.customersService.upsertByPhone(
              legacy.customerName,
              legacy.phone,
              legacy.address || null,
              null,
            );
          }

          const prop = this.propertyRepo.create({
            propertyTaxNo: legacy.propertyTaxNo,
            address: legacy.address,
            status: 'Active',
            customer,
            createdBy: { id: legacy.created_by } as any,
          });
          propertyMap.set(legacy.propertyTaxNo, await this.propertyRepo.save(prop));
        }
      }

      for (const legacy of legacyRecords) {
        const prop = propertyMap.get(legacy.propertyTaxNo);
        if (!prop) continue;

        const record = this.recordRepo.create({
          serviceType: legacy.serviceType,
          officialFee: legacy.officialFee,
          serviceFee: legacy.serviceFee,
          protocolFee: legacy.protocolFee,
          amountCharged: legacy.amountCharged,
          dateOfService: legacy.dateOfService,
          details: { customerName: legacy.customerName, phone: legacy.phone },
          property: prop,
          createdBy: { id: legacy.created_by } as any,
        });
        await this.recordRepo.save(record);
      }

      console.log(`Migrated ${legacyRecords.length} legacy property tax records`);
    } finally {
      await queryRunner.release();
    }
  }

  // ── Properties ──────────────────────────────────────────────────────────────

  async findAllProperties(filter: PropertyTaxFilterDto): Promise<Property[]> {
    const qb = this.propertyRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.customer', 'c')
      .orderBy('p.createdAt', 'DESC');

    if (filter.search) {
      qb.andWhere(
        '(LOWER(p.propertyTaxNo) LIKE :s OR LOWER(p.address) LIKE :s OR LOWER(c.name) LIKE :s OR c.phone LIKE :s)',
        { s: `%${filter.search.toLowerCase()}%` },
      );
    }

    return qb.getMany();
  }

  async findPropertyDetails(id: string) {
    const property = await this.propertyRepo.findOne({
      where: { id },
      relations: ['customer', 'records', 'records.createdBy', 'records.payments'],
    });
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async approveProperty(id: string, propertyTaxNo: string): Promise<Property> {
    const property = await this.propertyRepo.findOne({ where: { id } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.status === 'Approved') {
      throw new BadRequestException('Property is already approved');
    }

    const existing = await this.propertyRepo.findOne({ where: { propertyTaxNo } });
    if (existing && existing.id !== id) {
      throw new BadRequestException(`Property Tax No "${propertyTaxNo}" is already assigned`);
    }

    property.propertyTaxNo = propertyTaxNo;
    property.status = 'Approved';
    return this.propertyRepo.save(property);
  }

  // ── Service Records ─────────────────────────────────────────────────────────

  async createRecord(dto: CreatePropertyTaxRecordDto, creator: User): Promise<PropertyTaxRecord> {
    let property = await this.propertyRepo.findOne({
      where: { propertyTaxNo: dto.propertyTaxNo },
      relations: ['customer'],
    });

    if (!property) {
      let customer = null;
      if (dto.phone) {
        customer = await this.customersService.upsertByPhone(
          dto.customerName,
          dto.phone,
          dto.address || null,
          null,
        );
      }

      property = this.propertyRepo.create({
        propertyTaxNo: dto.propertyTaxNo,
        address: dto.address,
        status: 'Active',
        customer,
        createdBy: creator,
      });
      property = await this.propertyRepo.save(property);
    } else {
      if (dto.address && dto.address !== property.address) {
        property.address = dto.address;
      }
      if (dto.phone) {
        const customer = await this.customersService.upsertByPhone(
          dto.customerName,
          dto.phone,
          dto.address || null,
          null,
        );
        property.customer = customer;
      }
      if (property.customer || dto.customerName) {
        property = await this.propertyRepo.save(property);
      }
    }

    const record = this.recordRepo.create({
      serviceType: dto.serviceType,
      officialFee: dto.officialFee,
      serviceFee: dto.serviceFee,
      protocolFee: dto.protocolFee,
      amountCharged: dto.amountCharged,
      dateOfService: dto.dateOfService,
      details: { customerName: dto.customerName, phone: dto.phone },
      property,
      createdBy: creator,
    });

    return this.recordRepo.save(record);
  }

  async findAllRecords(filter: PropertyTaxFilterDto): Promise<PropertyTaxRecord[] | { records: PropertyTaxRecord[]; total: number; page: number; limit: number; totalPages: number }> {
    return super.findAll(
      filter,
      ['property.propertyTaxNo', 'property.address', 'details.customerName', 'details.phone'],
      (qb) => {
        qb.leftJoinAndSelect('entity.property', 'property')
          .leftJoinAndSelect('property.customer', 'customer')
          .leftJoinAndSelect('entity.payments', 'payments');
      },
    );
  }

  async findOneRecord(id: string): Promise<PropertyTaxRecord> {
    const record = await this.recordRepo.findOne({
      where: { id },
      relations: ['property', 'property.customer', 'createdBy', 'payments', 'payments.createdBy'],
    });
    if (!record) throw new NotFoundException('Property Tax record not found');
    return record;
  }

  async updateRecord(id: string, dto: UpdatePropertyTaxRecordDto): Promise<PropertyTaxRecord> {
    const record = await this.findOneRecord(id);
    Object.assign(record, dto);
    return this.recordRepo.save(record);
  }

  // ── Payments ────────────────────────────────────────────────────────────────

  async findAllPayments(filter: PropertyTaxFilterDto): Promise<PropertyTaxPayment[]> {
    const qb = this.paymentRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.createdBy', 'u')
      .leftJoinAndSelect('p.record', 'r')
      .leftJoinAndSelect('r.property', 'prop')
      .orderBy('p.paymentDate', 'DESC')
      .addOrderBy('p.createdAt', 'DESC');

    if (filter.search) {
      qb.andWhere('(prop.propertyTaxNo LIKE :s)', { s: `%${filter.search}%` });
    }

    return qb.getMany();
  }

  async createPayment(recordId: string, dto: CreatePropertyTaxPaymentDto, creator: User): Promise<PropertyTaxPayment> {
    const record = await this.recordRepo.findOne({ where: { id: recordId } });
    if (!record) throw new NotFoundException('Property Tax record not found');

    const payment = this.paymentRepo.create({
      ...dto,
      record,
      createdBy: creator,
    });
    return this.paymentRepo.save(payment);
  }

  async deletePayment(id: string): Promise<void> {
    const payment = await this.paymentRepo.findOne({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');
    await this.paymentRepo.softRemove(payment);
  }

  // ── Fee Configs ─────────────────────────────────────────────────────────────

  async findAllConfigs(): Promise<PropertyTaxFeeConfig[]> {
    return this.configRepo.find({ order: { serviceType: 'ASC' } });
  }

  async createConfig(dto: CreatePropertyTaxFeeConfigDto): Promise<PropertyTaxFeeConfig> {
    const config = this.configRepo.create(dto as any);
    return this.configRepo.save(config as any);
  }

  async updateConfig(id: string, dto: CreatePropertyTaxFeeConfigDto): Promise<PropertyTaxFeeConfig> {
    const config = await this.configRepo.findOne({ where: { id } });
    if (!config) throw new NotFoundException('Fee config not found');
    Object.assign(config, dto);
    return this.configRepo.save(config as any);
  }

  async deleteConfig(id: string): Promise<void> {
    const config = await this.configRepo.findOne({ where: { id } });
    if (!config) throw new NotFoundException('Fee config not found');
    await this.configRepo.softRemove(config);
  }

  // ── Dashboard & Customer History ────────────────────────────────────────────

  async getDashboardMetrics(from: string, to: string): Promise<ServiceMetricsResult> {
    const records = await this.recordRepo.createQueryBuilder('r')
      .leftJoinAndSelect('r.payments', 'p')
      .leftJoinAndSelect('r.createdBy', 'u')
      .where('r.dateOfService >= :from AND r.dateOfService <= :to', { from, to })
      .getMany();

    let count = 0;
    let gross = 0;
    let net = 0;
    const dailyMap = new Map<string, number>();
    const userMap = new Map<string, { userId: string; userName: string; gross: number; net: number }>();

    for (const r of records) {
      count++;
      const totalPaid = (r.payments || []).reduce((s, p) => s + Number(p.amount), 0);
      const grossVal = totalPaid || Number(r.amountCharged || 0);
      gross += grossVal;

      const netVal = grossVal - Number(r.officialFee || 0);
      net += netVal;

      const rawDate = r.dateOfService as any;
      const dateStr = rawDate instanceof Date
        ? rawDate.toISOString().split('T')[0]
        : String(rawDate).split('T')[0];
      dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + netVal);

      const uid = r.createdBy?.id || 'unknown';
      const uname = r.createdBy?.name || 'Unknown User';
      if (!userMap.has(uid)) {
        userMap.set(uid, { userId: uid, userName: uname, gross: 0, net: 0 });
      }
      const userStat = userMap.get(uid)!;
      userStat.gross += grossVal;
      userStat.net += netVal;
    }

    const daily = Array.from(dailyMap.entries()).map(([date, net]) => ({ date, net }));
    const userBreakdown = Array.from(userMap.values());

    return {
      key: 'propertyTax',
      label: 'Property Tax',
      category: 'KMC',
      count,
      gross,
      net,
      daily,
      userBreakdown,
    };
  }

  async getCustomerHistory(customerId: string): Promise<CustomerHistoryItem[]> {
    const records = await this.recordRepo.createQueryBuilder('r')
      .leftJoin('r.property', 'property')
      .leftJoin('property.customer', 'customer')
      .leftJoinAndSelect('r.createdBy', 'u')
      .where('customer.id = :customerId', { customerId })
      .getMany();

    return records.map(r => ({
      id: r.id,
      type: 'property-tax',
      typeName: 'Property Tax Service',
      dateOfService: r.dateOfService,
      amountCharged: Number(r.amountCharged),
      description: `Service: ${r.serviceType}, Property Tax No: ${r.property?.propertyTaxNo || ''}`,
      createdBy: r.createdBy?.name || 'Unknown',
      createdAt: r.createdAt,
    }));
  }
}
