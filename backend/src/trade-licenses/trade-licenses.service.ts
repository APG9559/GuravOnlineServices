import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Business } from './business.entity';
import { TradeLicenseRecord } from './trade-license-record.entity';
import { TradeLicensePayment } from './trade-license-payment.entity';
import { TradeTypeConfig } from './trade-type-config.entity';
import { Customer } from '../customers/customer.entity';
import { User } from '../users/user.entity';
import { Affidavit } from '../affidavits/affidavit.entity';
import { PropertyCard } from '../property-cards/property-card.entity';
import { ShopActLicense } from '../shop-act-licenses/shop-act-license.entity';
import {
  CreateTradeTypeConfigDto,
  CreateTradeLicenseRecordDto,
  UpdateTradeLicenseRecordDto,
  TradeLicenseFilterDto,
  CreateTradeLicensePaymentDto,
  TradeLicensePaymentFilterDto,
} from './trade-licenses.dto';
import { IDashboardMetrics, ServiceMetricsResult } from '../common/interfaces/service-metrics.interface';
import { ICustomerHistoryProvider, CustomerHistoryItem } from '../common/interfaces/customer-history.interface';

@Injectable()
export class TradeLicensesService implements IDashboardMetrics, ICustomerHistoryProvider {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,

    @InjectRepository(TradeLicenseRecord)
    private readonly recordRepo: Repository<TradeLicenseRecord>,

    @InjectRepository(TradeTypeConfig)
    private readonly configRepo: Repository<TradeTypeConfig>,

    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,

    @InjectRepository(Affidavit)
    private readonly affidavitRepo: Repository<Affidavit>,

    @InjectRepository(PropertyCard)
    private readonly propertyCardRepo: Repository<PropertyCard>,

    @InjectRepository(ShopActLicense)
    private readonly shopActRepo: Repository<ShopActLicense>,

    @InjectRepository(TradeLicensePayment)
    private readonly paymentRepo: Repository<TradeLicensePayment>,
  ) { }

  // ── Config Management ──────────────────────────────────────────────────────

  async findAllConfigs(): Promise<TradeTypeConfig[]> {
    return this.configRepo.find({ order: { tradeType: 'ASC', tradeSubtype: 'ASC' } });
  }

  async createConfig(dto: CreateTradeTypeConfigDto): Promise<TradeTypeConfig> {
    const config = this.configRepo.create(dto);
    return this.configRepo.save(config);
  }

  async deleteConfig(id: string): Promise<void> {
    const config = await this.configRepo.findOne({ where: { id } });
    if (!config) throw new NotFoundException('Configuration not found');
    await this.configRepo.softRemove(config);
  }

  // ── Business Management ────────────────────────────────────────────────────

  async findAllBusinesses(filter: TradeLicenseFilterDto): Promise<Business[]> {
    const qb = this.businessRepo.createQueryBuilder('b')
      .leftJoinAndSelect('b.customers', 'c')
      .orderBy('b.name', 'ASC');

    if (filter.search) {
      qb.andWhere(
        '(LOWER(b.name) LIKE :s OR b.licenseNo LIKE :s OR LOWER(c.name) LIKE :s OR c.phone LIKE :s)',
        { s: `%${filter.search.toLowerCase()}%` }
      );
    }

    return qb.getMany();
  }

  async findBusinessDetails(id: string) {
    const business = await this.businessRepo.findOne({
      where: { id },
      relations: ['customers'],
    });
    if (!business) throw new NotFoundException('Business not found');

    const records = await this.recordRepo.find({
      where: { business: { id } },
      relations: ['createdBy'],
      order: { dateOfService: 'DESC', createdAt: 'DESC' },
    });

    return {
      ...business,
      records,
    };
  }

  async getRenewalQueue(): Promise<Business[]> {
    const today = new Date();
    const currentMonth = today.getMonth(); // 0 = Jan, 1 = Feb, 2 = Mar, 3 = Apr

    // Only populate renewal queue during March (2) and April (3)
    if (currentMonth !== 2 && currentMonth !== 3) {
      return [];
    }

    const currentYear = today.getFullYear();
    // A business is due for renewal if status is Approved AND it has a license number AND lastRenewalYear is less than currentYear
    return this.businessRepo.createQueryBuilder('b')
      .leftJoinAndSelect('b.customers', 'c')
      .where('b.status = :status', { status: 'Approved' })
      .andWhere('b.licenseNo IS NOT NULL')
      .andWhere('(b.lastRenewalYear IS NULL OR b.lastRenewalYear < :year)', { year: currentYear })
      .orderBy('b.name', 'ASC')
      .getMany();
  }

  // ── Record Management ──────────────────────────────────────────────────────

  async findAllRecords(filter: TradeLicenseFilterDto): Promise<TradeLicenseRecord[]> {
    const qb = this.recordRepo.createQueryBuilder('r')
      .leftJoinAndSelect('r.business', 'b')
      .leftJoinAndSelect('b.customers', 'c')
      .leftJoinAndSelect('r.createdBy', 'u')
      .leftJoinAndSelect('r.linkedAffidavit', 'la')
      .leftJoinAndSelect('r.linkedPropertyCard', 'lpc')
      .leftJoinAndSelect('r.linkedShopAct', 'lsa')
      .orderBy('r.dateOfService', 'DESC')
      .addOrderBy('r.createdAt', 'DESC');

    if (filter.search) {
      qb.andWhere(
        '(LOWER(b.name) LIKE :s OR b.licenseNo LIKE :s OR LOWER(c.name) LIKE :s OR c.phone LIKE :s OR r.tokenNo LIKE :s)',
        { s: `%${filter.search.toLowerCase()}%` }
      );
    }

    if (filter.from) {
      qb.andWhere('r.dateOfService >= :from', { from: filter.from });
    }

    if (filter.to) {
      qb.andWhere('r.dateOfService <= :to', { to: filter.to });
    }

    return qb.getMany();
  }

  async findOneRecord(id: string): Promise<TradeLicenseRecord> {
    const record = await this.recordRepo.findOne({
      where: { id },
      relations: ['business', 'business.customers', 'createdBy', 'linkedAffidavit', 'linkedPropertyCard', 'linkedShopAct'],
    });
    if (!record) throw new NotFoundException('Service record not found');
    return record;
  }

  async createRecord(dto: CreateTradeLicenseRecordDto, creator: User): Promise<TradeLicenseRecord> {
    let business: Business;

    if (dto.serviceType === 'New') {
      if (!dto.newBusinessData) {
        throw new BadRequestException('newBusinessData is required for New Trade License applications');
      }

      // 1. Create/Retrieve partners (customers)
      const customers: Customer[] = [];
      for (const partner of dto.newBusinessData.partners) {
        let customer = await this.customerRepo.findOne({ where: { phone: partner.phone } });
        if (customer) {
          customer.name = partner.name;
          if (partner.email !== undefined) customer.email = partner.email;
          customer = await this.customerRepo.save(customer);
        } else {
          customer = this.customerRepo.create({
            name: partner.name,
            phone: partner.phone,
            email: partner.email || null,
          });
          customer = await this.customerRepo.save(customer);
        }
        customers.push(customer);
      }

      // 2. Create the Business
      business = this.businessRepo.create({
        name: dto.newBusinessData.name,
        tradeType: dto.newBusinessData.tradeType,
        tradeSubtype: dto.newBusinessData.tradeSubtype,
        email: dto.newBusinessData.email || null,
        phone: dto.newBusinessData.phone || null,
        status: 'Pending',
        customers,
      });
      business = await this.businessRepo.save(business);

      // Force record details status to 'Pending'
      if (!dto.details) dto.details = {};
      dto.details.status = 'Pending';
    } else {
      if (!dto.businessId) {
        throw new BadRequestException('businessId is required for this service type');
      }

      // Retrieve existing business
      business = await this.businessRepo.findOne({
        where: { id: dto.businessId },
        relations: ['customers'],
      });
      if (!business) throw new NotFoundException('Business not found');

      // 3. Process business adjustments based on service type
      const details = dto.details || {};
      const currentYear = new Date().getFullYear();

      switch (dto.serviceType) {
        case 'Renew':
          business.lastRenewalYear = currentYear;
          break;

        case 'Transfer_Heir':
        case 'Transfer_Third_Party': {
          // Resolve transfer recipient customer
          let recipient = await this.customerRepo.findOne({ where: { phone: details.transferToPhone } });
          if (recipient) {
            recipient.name = details.transferToName;
            recipient = await this.customerRepo.save(recipient);
          } else {
            recipient = this.customerRepo.create({
              name: details.transferToName,
              phone: details.transferToPhone,
            });
            recipient = await this.customerRepo.save(recipient);
          }
          business.customers = [recipient];
          break;
        }

        case 'Name_Change':
          business.name = details.newBusinessName;
          break;

        case 'Trade_Change':
          business.tradeType = details.newTradeType;
          business.tradeSubtype = details.newTradeSubtype;
          break;

        case 'Partner_Change': {
          const newCustomers: Customer[] = [];
          for (const p of details.newPartners || []) {
            let customer = await this.customerRepo.findOne({ where: { phone: p.phone } });
            if (customer) {
              customer.name = p.name;
              customer = await this.customerRepo.save(customer);
            } else {
              customer = this.customerRepo.create({
                name: p.name,
                phone: p.phone,
              });
              customer = await this.customerRepo.save(customer);
            }
            newCustomers.push(customer);
          }
          if (newCustomers.length > 0) {
            business.customers = newCustomers;
          }
          break;
        }

        case 'Cancel':
          business.status = 'Cancelled';
          break;
      }

      business = await this.businessRepo.save(business);
    }

    // 4. Resolve linked documents if provided
    const linkedAffidavit = dto.linkedAffidavitId
      ? await this.affidavitRepo.findOneBy({ id: dto.linkedAffidavitId })
      : null;
    const linkedPropertyCard = dto.linkedPropertyCardId
      ? await this.propertyCardRepo.findOneBy({ id: dto.linkedPropertyCardId })
      : null;
    const linkedShopAct = dto.linkedShopActId
      ? await this.shopActRepo.findOneBy({ id: dto.linkedShopActId })
      : null;

    // 5. Create the Service Record
    const record = this.recordRepo.create({
      serviceType: dto.serviceType,
      dateOfService: dto.dateOfService,
      amountCharged: dto.amountCharged,
      officialFee: dto.officialFee,
      serviceFee: dto.serviceFee,
      protocolFee: dto.protocolFee || null,
      miscFee: dto.miscFee || null,
      tokenNo: dto.tokenNo || null,
      details: dto.details || null,
      business,
      createdBy: creator,
      linkedAffidavit,
      linkedPropertyCard,
      linkedShopAct,
    });

    return this.recordRepo.save(record);
  }

  async updateRecord(id: string, dto: UpdateTradeLicenseRecordDto): Promise<TradeLicenseRecord> {
    const record = await this.findOneRecord(id);

    // Apply partial updates to record fields
    if (dto.dateOfService !== undefined) record.dateOfService = dto.dateOfService;
    if (dto.amountCharged !== undefined) record.amountCharged = dto.amountCharged;
    if (dto.officialFee !== undefined) record.officialFee = dto.officialFee;
    if (dto.serviceFee !== undefined) record.serviceFee = dto.serviceFee;
    if (dto.protocolFee !== undefined) record.protocolFee = dto.protocolFee;
    if (dto.miscFee !== undefined) record.miscFee = dto.miscFee;
    if (dto.tokenNo !== undefined) record.tokenNo = dto.tokenNo;
    if (dto.details !== undefined) {
      record.details = { ...record.details, ...dto.details };
    }
    if (dto.linkedAffidavitId !== undefined) {
      record.linkedAffidavit = dto.linkedAffidavitId ? await this.affidavitRepo.findOneBy({ id: dto.linkedAffidavitId }) : null;
    }
    if (dto.linkedPropertyCardId !== undefined) {
      record.linkedPropertyCard = dto.linkedPropertyCardId ? await this.propertyCardRepo.findOneBy({ id: dto.linkedPropertyCardId }) : null;
    }
    if (dto.linkedShopActId !== undefined) {
      record.linkedShopAct = dto.linkedShopActId ? await this.shopActRepo.findOneBy({ id: dto.linkedShopActId }) : null;
    }

    return this.recordRepo.save(record);
  }

  async approveApplication(id: string, licenseNo: string): Promise<TradeLicenseRecord> {
    const record = await this.findOneRecord(id);
    if (record.serviceType !== 'New') {
      throw new BadRequestException('Only New Trade License records can be approved');
    }

    const business = record.business;
    business.status = 'Approved';
    business.licenseNo = licenseNo;
    business.lastRenewalYear = new Date().getFullYear();

    await this.businessRepo.save(business);

    if (!record.details) record.details = {};
    record.details.status = 'Approved';
    record.details.licenseNo = licenseNo;

    return this.recordRepo.save(record);
  }

  async deleteRecord(id: string): Promise<void> {
    const record = await this.findOneRecord(id);
    await this.recordRepo.softRemove(record);
  }

  // ── Payment Management ─────────────────────────────────────────────────────

  async addPayment(recordId: string, dto: CreateTradeLicensePaymentDto, creator: User): Promise<TradeLicensePayment> {
    const record = await this.recordRepo.findOne({ where: { id: recordId } });
    if (!record) throw new NotFoundException('Trade license record not found');

    const payment = this.paymentRepo.create({
      amount: dto.amount,
      paymentMode: dto.paymentMode,
      account: dto.account,
      paymentDate: dto.paymentDate,
      notes: dto.notes || null,
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

  async findAllPayments(filter: TradeLicensePaymentFilterDto): Promise<TradeLicensePayment[]> {
    const qb = this.paymentRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.createdBy', 'u')
      .leftJoinAndSelect('p.record', 'r')
      .leftJoinAndSelect('r.business', 'b')
      .leftJoinAndSelect('b.customers', 'c')
      .orderBy('p.paymentDate', 'DESC')
      .addOrderBy('p.createdAt', 'DESC');

    if (filter.paymentMode) {
      qb.andWhere('p.paymentMode = :mode', { mode: filter.paymentMode });
    }

    if (filter.account) {
      qb.andWhere('p.account = :account', { account: filter.account });
    }

    if (filter.search) {
      qb.andWhere(
        '(LOWER(b.name) LIKE :s OR b.licenseNo LIKE :s OR LOWER(c.name) LIKE :s OR c.phone LIKE :s OR r.tokenNo LIKE :s OR LOWER(u.name) LIKE :s)',
        { s: `%${filter.search.toLowerCase()}%` },
      );
    }

    return qb.getMany();
  }

  async getDashboardMetrics(from: string, to: string): Promise<ServiceMetricsResult> {
    const records = await this.recordRepo.createQueryBuilder('r')
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
      const grossVal = Number(r.amountCharged || 0);
      gross += grossVal;

      const netVal = grossVal - Number(r.officialFee || 0);
      net += netVal;

      const dateVal = r.dateOfService as any;
      const dateStr = dateVal instanceof Date ? dateVal.toISOString().split('T')[0] : String(dateVal).split('T')[0];
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
      key: 'tradeLicenses',
      label: 'Trade Licenses',
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
      .innerJoin('r.business', 'b')
      .innerJoin('b.customers', 'c')
      .leftJoinAndSelect('r.createdBy', 'u')
      .where('c.id = :customerId', { customerId })
      .getMany();

    return records.map(t => ({
      id: t.id,
      type: 'trade-license',
      typeName: 'Trade License',
      dateOfService: t.dateOfService,
      amountCharged: Number(t.amountCharged),
      description: `Service: ${t.serviceType}, Business: ${t.business?.name}${t.tokenNo ? `, Token: ${t.tokenNo}` : ''}`,
      createdBy: t.createdBy?.name || 'Unknown',
      createdAt: t.createdAt,
    }));
  }
}
