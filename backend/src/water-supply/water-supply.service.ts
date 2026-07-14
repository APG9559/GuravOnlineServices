import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WaterConnection } from './water-connection.entity';
import { WaterServiceRecord } from './water-service-record.entity';
import { WaterPayment } from './water-payment.entity';
import { WaterFeeConfig } from './water-fee-config.entity';
import { WaterDocument } from './water-document.entity';
import {
  CreateWaterServiceRecordDto,
  UpdateWaterServiceRecordDto,
  CreateWaterPaymentDto,
  CreateWaterFeeConfigDto,
  CreateWaterDocumentDto,
  WaterSupplyFilterDto,
} from './water-supply.dto';
import { User } from '../users/user.entity';
import { CustomersService } from '../customers/customers.service';
import { BaseRecordService } from '../common/base-record.service';
import { IDashboardMetrics, ServiceMetricsResult } from '../common/interfaces/service-metrics.interface';
import { ICustomerHistoryProvider, CustomerHistoryItem } from '../common/interfaces/customer-history.interface';

@Injectable()
export class WaterSupplyService
  extends BaseRecordService<WaterServiceRecord>
  implements IDashboardMetrics, ICustomerHistoryProvider, OnModuleInit
{
  constructor(
    @InjectRepository(WaterServiceRecord)
    private readonly wsRecordRepo: Repository<WaterServiceRecord>,

    @InjectRepository(WaterConnection)
    private readonly connectionRepo: Repository<WaterConnection>,

    @InjectRepository(WaterPayment)
    private readonly paymentRepo: Repository<WaterPayment>,

    @InjectRepository(WaterFeeConfig)
    private readonly feeConfigRepo: Repository<WaterFeeConfig>,

    @InjectRepository(WaterDocument)
    private readonly documentRepo: Repository<WaterDocument>,

    customersService: CustomersService,
  ) {
    super(wsRecordRepo, customersService, 'Water Supply service record');
  }

  async onModuleInit() {
    await this.migrateLegacyData();
  }

  private async migrateLegacyData() {
    const queryRunner = this.wsRecordRepo.manager.connection.createQueryRunner();
    const hasLegacyTable = await queryRunner.hasTable('water_supply_records');
    if (!hasLegacyTable) return;

    const connectionCount = await this.connectionRepo.count();
    if (connectionCount > 0) return; // Already migrated

    console.log('⚡ Starting Water Supply Legacy Data Migration...');
    try {
      const legacyRecords = await queryRunner.query('SELECT * FROM water_supply_records ORDER BY "createdAt" ASC');
      for (const legacy of legacyRecords) {
        let customer = null;
        if (legacy.phone && legacy.customerName) {
          customer = await this.customersService.upsertByPhone(
            legacy.customerName,
            legacy.phone,
            legacy.connectionAddress || null,
            null,
          );
        }

        let connection = null;
        if (legacy.connectionNo) {
          connection = await this.connectionRepo.findOne({ where: { connectionNo: legacy.connectionNo } });
        }

        if (!connection) {
          connection = this.connectionRepo.create({
            connectionNo: legacy.connectionNo || null,
            currentOwner: legacy.customerName,
            customer,
            connectionAddress: legacy.connectionAddress,
            contactPersonName: legacy.contactPersonName || null,
            contactPersonPhone: legacy.contactPersonPhone || null,
            currentUsage: legacy.currentUsage || 'Domestic',
            connectionStatus: legacy.connectionNo ? 'Active' : 'Pending',
            meterDetails: null,
            createdBy: { id: legacy.created_by } as any,
            createdAt: legacy.createdAt,
          });
          connection = await this.connectionRepo.save(connection);
        }

        const details = {
          plumberName: legacy.plumberName || null,
          plumberPhone: legacy.plumberPhone || null,
          contactPersonName: legacy.contactPersonName || null,
          contactPersonPhone: legacy.contactPersonPhone || null,
          currentOwner: legacy.currentOwner || null,
          newOwnerName: legacy.newOwnerName || null,
          newOwnerPhone: legacy.newOwnerPhone || null,
          transferSubtype: legacy.transferSubtype || null,
          currentUsage: legacy.currentUsage || null,
          newUsage: legacy.newUsage || null,
        };

        const record = this.wsRecordRepo.create({
          id: legacy.id,
          serviceType: legacy.serviceType,
          dateOfService: legacy.dateOfService,
          applicationDate: legacy.applicationDate,
          applicationTokenNo: legacy.applicationTokenNo,
          officialFee: Number(legacy.officialFee || 0),
          serviceFee: Number(legacy.serviceFee || 0),
          protocolFee: 0,
          miscFee: 0,
          discount: 0,
          amountCharged: Number(legacy.amountCharged || 0),
          remarks: 'Migrated legacy record',
          details,
          connection,
          createdBy: { id: legacy.created_by } as any,
          createdAt: legacy.createdAt,
        });
        const savedRecord = await this.wsRecordRepo.save(record);

        // Add matching payment
        const payment = this.paymentRepo.create({
          amount: Number(legacy.amountCharged || 0),
          paymentMode: 'Cash',
          paymentDate: legacy.dateOfService,
          account: 'Counter Cash',
          notes: 'Migrated payment',
          record: savedRecord,
          createdBy: { id: legacy.created_by } as any,
          createdAt: legacy.createdAt,
        });
        await this.paymentRepo.save(payment);
      }
      console.log('✅ Water Supply Legacy Data Migration completed successfully!');
    } catch (err) {
      console.error('❌ Legacy water supply migration failed:', err);
    }
  }

  // ── Configs ────────────────────────────────────────────────────────────────

  async findAllConfigs(): Promise<WaterFeeConfig[]> {
    return this.feeConfigRepo.find({ order: { serviceType: 'ASC' } });
  }

  async createConfig(dto: CreateWaterFeeConfigDto): Promise<WaterFeeConfig> {
    const existing = await this.feeConfigRepo.findOne({ where: { serviceType: dto.serviceType } });
    if (existing) throw new BadRequestException(`Config for service type "${dto.serviceType}" already exists`);
    const config = this.feeConfigRepo.create(dto);
    return this.feeConfigRepo.save(config);
  }

  async updateConfig(id: string, dto: CreateWaterFeeConfigDto): Promise<WaterFeeConfig> {
    const config = await this.feeConfigRepo.findOne({ where: { id } });
    if (!config) throw new NotFoundException('Configuration not found');
    Object.assign(config, dto);
    return this.feeConfigRepo.save(config);
  }

  async deleteConfig(id: string): Promise<void> {
    const config = await this.feeConfigRepo.findOne({ where: { id } });
    if (!config) throw new NotFoundException('Configuration not found');
    await this.feeConfigRepo.softRemove(config);
  }

  // ── Connections ────────────────────────────────────────────────────────────

  async findAllConnections(filter: WaterSupplyFilterDto): Promise<WaterConnection[]> {
    const qb = this.connectionRepo.createQueryBuilder('c')
      .leftJoinAndSelect('c.customer', 'cust')
      .orderBy('c.createdAt', 'DESC');

    if (filter.search) {
      qb.andWhere(
        '(LOWER(c.currentOwner) LIKE :s OR c.connectionNo LIKE :s OR LOWER(c.connectionAddress) LIKE :s OR LOWER(cust.name) LIKE :s OR cust.phone LIKE :s OR c.contactPersonPhone LIKE :s)',
        { s: `%${filter.search.toLowerCase()}%` }
      );
    }

    return qb.getMany();
  }

  async findConnectionDetails(id: string) {
    const connection = await this.connectionRepo.findOne({
      where: { id },
      relations: ['customer'],
    });
    if (!connection) throw new NotFoundException('Connection not found');

    const records = await this.wsRecordRepo.find({
      where: { connection: { id } },
      relations: ['createdBy', 'payments', 'documents'],
      order: { dateOfService: 'DESC', createdAt: 'DESC' },
    });

    return {
      ...connection,
      records,
    };
  }

  async approveConnection(id: string, connectionNo: string | undefined | null, operator: User): Promise<WaterConnection> {
    const connection = await this.connectionRepo.findOne({ where: { id } });
    if (!connection) throw new NotFoundException('Connection not found');

    const trimmedNo = connectionNo?.trim() || null;

    if (trimmedNo) {
      const existingNo = await this.connectionRepo.findOne({ where: { connectionNo: trimmedNo } });
      if (existingNo && existingNo.id !== id) {
        throw new BadRequestException(`Connection Number "${trimmedNo}" is already assigned to another profile`);
      }
      connection.connectionNo = trimmedNo;
    } else {
      connection.connectionNo = null;
    }

    connection.connectionStatus = 'Active';
    return this.connectionRepo.save(connection);
  }

  // ── Service Records ────────────────────────────────────────────────────────

  async findAllRecords(filter: WaterSupplyFilterDto) {
    return super.findAll(
      filter,
      [
        'connection.connectionNo',
        'connection.currentOwner',
        'connection.contactPersonPhone',
        'connection.connectionAddress',
        'entity.applicationTokenNo',
      ],
      (qb) => {
        qb.leftJoinAndSelect('entity.connection', 'connection')
          .leftJoinAndSelect('connection.customer', 'customer')
          .leftJoinAndSelect('entity.payments', 'payments')
          .leftJoinAndSelect('entity.documents', 'documents');
      }
    );
  }

  async findOneRecord(id: string): Promise<WaterServiceRecord> {
    const record = await this.wsRecordRepo.findOne({
      where: { id },
      relations: ['connection', 'connection.customer', 'createdBy', 'payments', 'payments.createdBy', 'documents', 'documents.createdBy'],
    });
    if (!record) throw new NotFoundException('Water service record not found');
    return record;
  }

  async createRecord(dto: CreateWaterServiceRecordDto, creator: User): Promise<WaterServiceRecord> {
    let connection: WaterConnection;

    if (dto.serviceType === 'NewConnection') {
      let customer = null;
      if (dto.phone && dto.customerName) {
        customer = await this.customersService.upsertByPhone(
          dto.customerName,
          dto.phone,
          dto.connectionAddress || null,
          null,
        );
      }

      connection = this.connectionRepo.create({
        connectionNo: dto.connectionNo || null,
        currentOwner: dto.customerName || '',
        customer,
        connectionAddress: dto.connectionAddress || '',
        contactPersonName: dto.contactPersonName || null,
        contactPersonPhone: dto.contactPersonPhone || null,
        currentUsage: dto.currentUsage || 'Domestic',
        connectionStatus: dto.connectionNo ? 'Active' : 'Pending',
        meterDetails: dto.meterDetails || null,
        createdBy: creator,
      });
      connection = await this.connectionRepo.save(connection);
    } else {
      if (!dto.connectionId) {
        throw new BadRequestException('connectionId is required for this service type');
      }

      connection = await this.connectionRepo.findOne({
        where: { id: dto.connectionId },
        relations: ['customer'],
      });
      if (!connection) throw new NotFoundException('Water connection not found');

      const details = dto.details || {};

      switch (dto.serviceType) {
        case 'ConnectionTransfer': {
          let recipient = null;
          if (details.transferToPhone && details.transferToName) {
            recipient = await this.customersService.upsertByPhone(
              details.transferToName,
              details.transferToPhone,
              connection.connectionAddress,
              null,
            );
          }
          connection.currentOwner = details.transferToName || connection.currentOwner;
          connection.customer = recipient || connection.customer;
          if (details.contactPersonName) connection.contactPersonName = details.contactPersonName;
          if (details.contactPersonPhone) connection.contactPersonPhone = details.contactPersonPhone;
          break;
        }

        case 'MeterDisconnection':
          connection.connectionStatus = 'Disconnected';
          break;

        case 'MeterReconnection':
          connection.connectionStatus = 'Active';
          break;

        case 'ChangeOfUse':
          connection.currentUsage = details.newUsage || connection.currentUsage;
          break;

        default:
          break;
      }
      connection = await this.connectionRepo.save(connection);
    }

    const record = this.wsRecordRepo.create({
      serviceType: dto.serviceType,
      dateOfService: dto.dateOfService,
      applicationDate: dto.applicationDate,
      applicationTokenNo: dto.applicationTokenNo || null,
      officialFee: dto.officialFee,
      serviceFee: dto.serviceFee,
      protocolFee: dto.protocolFee || 0,
      miscFee: dto.miscFee || 0,
      discount: dto.discount || 0,
      amountCharged: dto.amountCharged,
      remarks: dto.remarks || null,
      details: dto.details || null,
      connection,
      createdBy: creator,
    });

    const saved = await this.wsRecordRepo.save(record);
    return this.findOneRecord(saved.id);
  }

  async updateRecord(id: string, dto: UpdateWaterServiceRecordDto): Promise<WaterServiceRecord> {
    const record = await this.findOneRecord(id);

    // Extract base entity fields and flat fields
    const {
      dateOfService,
      applicationDate,
      applicationTokenNo,
      officialFee,
      serviceFee,
      protocolFee,
      miscFee,
      discount,
      amountCharged,
      remarks,
      details: nestedDetails,
      connectionNo,
      customerName,
      phone,
      connectionAddress,
      contactPersonName,
      contactPersonPhone,
      currentUsage,
      meterDetails,
      plumberName,
      plumberPhone,
      newOwnerName,
      newOwnerPhone,
      transferSubtype,
      newUsage,
    } = dto;

    if (dateOfService !== undefined) record.dateOfService = dateOfService;
    if (applicationDate !== undefined) record.applicationDate = applicationDate;
    if (applicationTokenNo !== undefined) record.applicationTokenNo = applicationTokenNo || null;
    if (officialFee !== undefined) record.officialFee = officialFee;
    if (serviceFee !== undefined) record.serviceFee = serviceFee;
    if (protocolFee !== undefined) record.protocolFee = protocolFee;
    if (miscFee !== undefined) record.miscFee = miscFee;
    if (discount !== undefined) record.discount = discount;
    if (amountCharged !== undefined) record.amountCharged = amountCharged;
    if (remarks !== undefined) record.remarks = remarks || null;

    // Update connection if referenced connection exists
    const connection = record.connection;
    if (connection) {
      if (connectionNo !== undefined) connection.connectionNo = connectionNo || null;
      if (connectionAddress !== undefined) connection.connectionAddress = connectionAddress || '';
      if (contactPersonName !== undefined) connection.contactPersonName = contactPersonName || null;
      if (contactPersonPhone !== undefined) connection.contactPersonPhone = contactPersonPhone || null;
      if (currentUsage !== undefined) connection.currentUsage = currentUsage || 'Domestic';
      if (meterDetails !== undefined) connection.meterDetails = meterDetails || null;

      // Update customer name & phone if provided
      if (customerName !== undefined || phone !== undefined) {
        const name = customerName !== undefined ? customerName : connection.currentOwner;
        const ph = phone !== undefined ? phone : (connection.customer?.phone || null);

        connection.currentOwner = name || '';
        if (ph && name) {
          const customer = await this.customersService.upsertByPhone(
            name,
            ph,
            connection.connectionAddress || null,
            null
          );
          connection.customer = customer;
        } else if (!ph) {
          connection.customer = null;
        }
      }

      await this.connectionRepo.save(connection);
    }

    // Sync details JSON
    const details = record.details || {};
    if (plumberName !== undefined) details.plumberName = plumberName || null;
    if (plumberPhone !== undefined) details.plumberPhone = plumberPhone || null;
    if (contactPersonName !== undefined) details.contactPersonName = contactPersonName || null;
    if (contactPersonPhone !== undefined) details.contactPersonPhone = contactPersonPhone || null;
    if (customerName !== undefined) details.customerName = customerName || null;
    if (newOwnerName !== undefined) details.newOwnerName = newOwnerName || null;
    if (newOwnerPhone !== undefined) details.newOwnerPhone = newOwnerPhone || null;
    if (transferSubtype !== undefined) details.transferSubtype = transferSubtype || null;
    if (currentUsage !== undefined) details.currentUsage = currentUsage || null;
    if (newUsage !== undefined) details.newUsage = newUsage || null;

    // Also support nested details object if provided
    if (nestedDetails) {
      Object.assign(details, nestedDetails);
    }

    record.details = details;

    // State transitions / propagation for updates
    if (record.serviceType === 'ConnectionTransfer' && connection) {
      const transferToName = newOwnerName !== undefined ? newOwnerName : details.newOwnerName;
      const transferToPhone = newOwnerPhone !== undefined ? newOwnerPhone : details.newOwnerPhone;

      // Update details fields for legacy alignment
      if (transferToName) {
        details.transferToName = transferToName;
        details.currentOwner = transferToName;
      }
      if (transferToPhone) {
        details.transferToPhone = transferToPhone;
      }

      if (transferToName || transferToPhone) {
        let recipient = null;
        if (transferToPhone && transferToName) {
          recipient = await this.customersService.upsertByPhone(
            transferToName,
            transferToPhone,
            connection.connectionAddress,
            null
          );
        }
        connection.currentOwner = transferToName || connection.currentOwner;
        if (recipient) {
          connection.customer = recipient;
        }
        await this.connectionRepo.save(connection);
      }
    }

    if (record.serviceType === 'ChangeOfUse' && connection) {
      const updatedNewUsage = newUsage !== undefined ? newUsage : details.newUsage;
      if (updatedNewUsage) {
        connection.currentUsage = updatedNewUsage;
        await this.connectionRepo.save(connection);
      }
    }

    await this.wsRecordRepo.save(record);
    return this.findOneRecord(record.id);
  }

  // ── Payments ──────────────────────────────────────────────────────────────

  async createPayment(recordId: string, dto: CreateWaterPaymentDto, creator: User): Promise<WaterPayment> {
    const record = await this.findOneRecord(recordId);

    const payment = this.paymentRepo.create({
      amount: dto.amount,
      paymentMode: dto.paymentMode,
      paymentDate: dto.paymentDate,
      account: dto.account,
      referenceNumber: dto.referenceNumber || null,
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

  async findAllPayments(filter: any): Promise<WaterPayment[]> {
    const qb = this.paymentRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.createdBy', 'u')
      .leftJoinAndSelect('p.record', 'r')
      .leftJoinAndSelect('r.connection', 'c')
      .orderBy('p.paymentDate', 'DESC')
      .addOrderBy('p.createdAt', 'DESC');

    if (filter.search) {
      qb.andWhere(
        '(LOWER(c.currentOwner) LIKE :s OR LOWER(p.paymentMode) LIKE :s OR LOWER(p.account) LIKE :s)',
        { s: `%${filter.search.toLowerCase()}%` }
      );
    }

    return qb.getMany();
  }

  // ── Documents ──────────────────────────────────────────────────────────────

  async createDocument(recordId: string, dto: CreateWaterDocumentDto, creator: User): Promise<WaterDocument> {
    const record = await this.findOneRecord(recordId);

    const document = this.documentRepo.create({
      documentType: dto.documentType,
      fileName: dto.fileName,
      remarks: dto.remarks || null,
      serviceRecord: record,
      createdBy: creator,
    });

    return this.documentRepo.save(document);
  }

  async deleteDocument(id: string): Promise<void> {
    const document = await this.documentRepo.findOne({ where: { id } });
    if (!document) throw new NotFoundException('Document not found');
    await this.documentRepo.softRemove(document);
  }

  // ── Metrics & Customer History ─────────────────────────────────────────────

  async getDashboardMetrics(from: string, to: string): Promise<ServiceMetricsResult> {
    // We aggregate based on payments recorded in the date range
    const raw = await this.paymentRepo.createQueryBuilder('p')
      .leftJoin('p.record', 'r')
      .leftJoin('p.createdBy', 'u')
      .select([
        'p.id',
        'p.amount',
        'p.paymentDate',
        'r.id',
        'r.serviceFee',
        'r.amountCharged',
        'u.id',
        'u.name',
      ])
      .where('p.paymentDate BETWEEN :from AND :to', { from, to })
      .getRawMany();

    const payments = raw.map((r) => ({
      id: r.p_id,
      amount: r.p_amount,
      paymentDate: r.p_paymentDate,
      record: r.r_id ? {
        id: r.r_id,
        serviceFee: r.r_serviceFee,
        amountCharged: r.r_amountCharged,
      } : null,
      createdBy: r.u_id ? {
        id: r.u_id,
        name: r.u_name,
      } : null,
    }));

    let count = 0;
    let gross = 0;
    let net = 0;
    const dailyMap = new Map<string, number>();
    const userMap = new Map<string, { userId: string; userName: string; gross: number; net: number }>();

    for (const p of payments) {
      const record = p.record;
      if (!record) continue;

      count++;
      const paymentAmount = Number(p.amount);
      gross += paymentAmount;

      // Net portion calculation: only count the service fee portion proportionally
      const serviceFeeRatio = Number(record.serviceFee) / (Number(record.amountCharged) || 1);
      const paymentNet = paymentAmount * serviceFeeRatio;
      net += paymentNet;

      const dateStr = p.paymentDate;
      dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + paymentNet);

      const uid = p.createdBy?.id || 'unknown';
      const uname = p.createdBy?.name || 'Unknown User';
      if (!userMap.has(uid)) {
        userMap.set(uid, { userId: uid, userName: uname, gross: 0, net: 0 });
      }
      const userStat = userMap.get(uid)!;
      userStat.gross += paymentAmount;
      userStat.net += paymentNet;
    }

    const daily = Array.from(dailyMap.entries()).map(([date, net]) => ({ date, net }));
    const userBreakdown = Array.from(userMap.values());

    return {
      key: 'waterSupply',
      label: 'Water Supply',
      category: 'KMC',
      count,
      gross,
      net,
      daily,
      userBreakdown,
    };
  }

  async getCustomerHistory(customerId: string): Promise<CustomerHistoryItem[]> {
    // Get service records for connections owned by this customer
    const records = await this.wsRecordRepo.find({
      where: {
        connection: {
          customer: { id: customerId },
        },
      },
      relations: ['connection', 'createdBy', 'payments'],
    });

    return records.map((w) => {
      const totalPaid = w.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      return {
        id: w.id,
        type: 'water-supply',
        typeName: 'Water Supply Service',
        dateOfService: w.dateOfService,
        amountCharged: Number(w.amountCharged),
        description: `Service: ${w.serviceType}, Token: ${w.applicationTokenNo}${
          w.connection.connectionNo ? `, Connection No: ${w.connection.connectionNo}` : ''
        } (Paid: ₹${totalPaid}, Balance: ₹${Number(w.amountCharged) - totalPaid})`,
        createdBy: w.createdBy?.name || 'Unknown',
        createdAt: w.createdAt,
      };
    });
  }
}

// Helper function to handle date queries in TypeORM
function BetweenDates(from: string, to: string) {
  const { Between } = require('typeorm');
  return Between(from, to);
}
