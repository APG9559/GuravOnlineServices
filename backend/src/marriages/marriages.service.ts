import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThanOrEqual } from 'typeorm';
import { Marriage } from './marriage.entity';
import { MarriageTicket, TicketStatus } from './marriage-ticket.entity';
import { MarriagePayment } from './marriage-payment.entity';
import { Affidavit } from '../affidavits/affidavit.entity';
import {
  CreateMarriageDto, UpdateMarriageDto, MarriageFilterDto,
  CreateMarriageTicketDto, TicketFilterDto, UpdateMarriageTicketDto,
  ConfirmTicketPayloadDto, AddPaymentDto, PaymentFilterDto,
} from './marriages.dto';
import { User } from '../users/user.entity';
import { CustomersService } from '../customers/customers.service';
import { PaperType, AuthorizerType } from '../common/enums';
import { IDashboardMetrics, ServiceMetricsResult } from '../common/interfaces/service-metrics.interface';
import { ICustomerHistoryProvider, CustomerHistoryItem } from '../common/interfaces/customer-history.interface';

@Injectable()
export class MarriagesService implements IDashboardMetrics, ICustomerHistoryProvider {
  constructor(
    @InjectRepository(Marriage)
    private readonly repo: Repository<Marriage>,
    @InjectRepository(Affidavit)
    private readonly affRepo: Repository<Affidavit>,
    @InjectRepository(MarriageTicket)
    private readonly ticketRepo: Repository<MarriageTicket>,
    @InjectRepository(MarriagePayment)
    private readonly paymentRepo: Repository<MarriagePayment>,
    private readonly customersService: CustomersService,
  ) {}

  // ── Ticket lifecycle ────────────────────────────────────────────────────

  async createTicket(dto: CreateMarriageTicketDto, user: User): Promise<MarriageTicket> {
    // Generate ticket number: EST-10001, EST-10002, …
    const lastTicket = await this.ticketRepo
      .createQueryBuilder('t')
      .orderBy('t.createdAt', 'DESC')
      .getOne();

    let nextNum = 10001;
    if (lastTicket?.ticketNumber) {
      const num = parseInt(lastTicket.ticketNumber.replace('EST-', ''), 10);
      if (!isNaN(num)) nextNum = num + 1;
    }

    const ticket = this.ticketRepo.create({
      ...dto,
      ticketNumber: `EST-${nextNum}`,
      status: TicketStatus.INQUIRED,
      createdBy: user,
    });

    return this.ticketRepo.save(ticket);
  }

  async confirmTicket(id: string, dto?: ConfirmTicketPayloadDto, user?: User): Promise<MarriageTicket> {
    return this.ticketRepo.manager.transaction(async (manager) => {
      const ticket = await manager.findOne(MarriageTicket, {
        where: { id },
        relations: ['createdBy'],
      });
      if (!ticket) throw new NotFoundException('Ticket not found');
      if (ticket.status !== TicketStatus.INQUIRED) {
        throw new BadRequestException(`Cannot confirm a ticket with status "${ticket.status}"`);
      }
      ticket.status = TicketStatus.CONFIRMED;
      const savedTicket = await manager.save(ticket);

      if (dto?.payment && dto.payment.amount > 0 && user) {
        const payment = manager.create(MarriagePayment, {
          amount: dto.payment.amount,
          paymentMode: dto.payment.paymentMode,
          account: dto.payment.account,
          paymentDate: dto.payment.paymentDate,
          notes: dto.payment.notes || null,
          ticket: savedTicket,
          createdBy: user,
        });
        await manager.save(payment);
      }

      return manager.findOne(MarriageTicket, {
        where: { id },
        relations: ['createdBy', 'marriage', 'payments', 'payments.createdBy'],
      });
    });
  }

  async findAllTickets(filter: TicketFilterDto): Promise<MarriageTicket[]> {
    const qb = this.ticketRepo.createQueryBuilder('t')
      .leftJoinAndSelect('t.createdBy', 'u')
      .leftJoinAndSelect('t.marriage', 'm')
      .leftJoinAndSelect('t.payments', 'p')
      .leftJoinAndSelect('p.createdBy', 'pu')
      .orderBy('t.createdAt', 'DESC');

    // 90-day TTL: hide expired Inquired/Confirmed tickets
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    qb.andWhere(
      '(t.status = :completed OR t.createdAt >= :ttl)',
      { completed: TicketStatus.COMPLETED, ttl: ninetyDaysAgo },
    );

    if (filter.status) {
      qb.andWhere('t.status = :status', { status: filter.status });
    }

    if (filter.search) {
      qb.andWhere(
        '(LOWER(t.contactName) LIKE :s OR t.phone LIKE :s OR t.ticketNumber LIKE :s)',
        { s: `%${filter.search.toLowerCase()}%` },
      );
    }

    return qb.getMany();
  }

  async findOneTicket(id: string): Promise<MarriageTicket> {
    const ticket = await this.ticketRepo.findOne({
      where: { id },
      relations: ['createdBy', 'marriage', 'payments', 'payments.createdBy'],
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async updateTicket(id: string, dto: UpdateMarriageTicketDto): Promise<MarriageTicket> {
    const ticket = await this.findOneTicket(id);
    if (ticket.status === TicketStatus.COMPLETED) {
      throw new BadRequestException('Cannot edit a completed ticket');
    }
    Object.assign(ticket, dto);
    return this.ticketRepo.save(ticket);
  }

  // ── Marriage CRUD ───────────────────────────────────────────────────────

  async create(dto: CreateMarriageDto, user: User): Promise<Marriage> {
    return this.repo.manager.transaction(async (manager) => {
      const { affidavitIds, ticketId, ...rest } = dto;

      let customer = null;
      if (dto.phone) {
        customer = await this.customersService.upsertByPhone(
          dto.contactName,
          dto.phone,
          dto.address,
          dto.contactEmail,
        );
      }

      const record = manager.create(Marriage, { ...rest, createdBy: user, customer });

      // ── Handle linked affidavits (manual or auto-generated) ──────────────
      const allAffidavits: Affidavit[] = [];

      // 1. Manually linked affidavits
      if (affidavitIds && affidavitIds.length > 0) {
        const manualAffs = await manager.findBy(Affidavit, { id: In(affidavitIds) });
        if (manualAffs.length !== affidavitIds.length) {
          throw new NotFoundException('Some linked affidavits were not found');
        }
        allAffidavits.push(...manualAffs);
      }

      // 2. Link manually selected/executed affidavits
      if (ticketId) {
        const ticket = await manager.findOne(MarriageTicket, { where: { id: ticketId }, relations: ['createdBy'] });
        if (!ticket) throw new NotFoundException('Ticket not found');
        if (ticket.status !== TicketStatus.CONFIRMED) {
          throw new BadRequestException('Ticket must be in Confirmed status to complete');
        }

        // Mark ticket as completed
        ticket.status = TicketStatus.COMPLETED;
        // Save marriage first, then link it
        record.affidavits = allAffidavits;
        const savedMarriage = await manager.save(record);

        // Link existing ticket payments to this marriage record
        await manager.createQueryBuilder()
          .update(MarriagePayment)
          .set({ marriage: savedMarriage })
          .where('ticket_id = :ticketId', { ticketId })
          .execute();

        ticket.marriage = savedMarriage;
        await manager.save(ticket);
        return savedMarriage;
      }

      record.affidavits = allAffidavits;
      return manager.save(record);
    });
  }

  private getRequiredAffidavitPurposes(q: Record<string, any>, dto: CreateMarriageDto): string[] {
    if (!q) return [];
    const purposes: string[] = [];

    const checkProof = (entry: any, purpose: string) => {
      if (entry && entry.correct === false && entry.affidavit === 'Yes') {
        purposes.push(purpose);
      }
    };

    const checkSituation = (entry: any, triggerOnValue: boolean, purpose: string) => {
      if (!entry || entry.affidavit !== 'Yes') return;
      const currentVal = entry.yes !== undefined ? entry.yes : entry.available;
      if (currentVal === triggerOnValue) purposes.push(purpose);
    };

    if (q.husband) {
      checkProof(q.husband.birthDateProof, 'Husband - Birth Date Proof Correction');
      checkProof(q.husband.residenceProof, 'Husband - Residence Proof Correction');
      checkProof(q.husband.identityProof, 'Husband - Identity Proof Correction');
    }
    if (q.wife) {
      checkProof(q.wife.birthDateProof, 'Wife - Birth Date Proof Correction');
      checkProof(q.wife.residenceProof, 'Wife - Residence Proof Correction');
      checkProof(q.wife.identityProof, 'Wife - Identity Proof Correction');
    }
    checkSituation(q.weddingInvitation, false, 'Wedding Invitation Affidavit');
    checkSituation(q.firstMarriage, false, 'Subsequent Marriage Affidavit');
    checkSituation(q.intercasteMarriage, true, 'Intercaste Marriage Affidavit');
    checkSituation(q.notRegisteredAnywhereElse, true, 'Not Registered Anywhere Else Affidavit');

    return purposes;
  }

  private async generateAffidavitsFromQuestionnaireTx(
    manager: any,
    q: Record<string, any>,
    dto: CreateMarriageDto,
    customer: any,
    user: User,
  ): Promise<Affidavit[]> {
    const affidavits: Affidavit[] = [];
    const { phone, dateOfService, affidavitDates } = dto;
    const dates = affidavitDates || {};

    // Helper to create an affidavit from a proof entry
    const createAff = async (purpose: string, entry: any, customCustomerName?: string) => {
      if (!entry || entry.correct === true || entry.affidavit !== 'Yes') return;

      const paperType = entry.paperType === 'stamp500' ? PaperType.STAMP500 : PaperType.PLAIN;
      const authorizerType = entry.authorizer === 'magistrate' ? AuthorizerType.MAGISTRATE : AuthorizerType.NOTARY;
      const amountCharged = entry.amountCharged ?? 0;
      const remark = entry.remark || null;

      const aff = manager.create(Affidavit, {
        customerName: customCustomerName || dto.contactName,
        phone,
        purpose,
        paperType,
        authorizerType,
        dateOfService: dates[purpose] || dateOfService,
        amountCharged,
        remark,
        customerBroughtStamp: entry.customerBroughtStamp === true,
        customer,
        createdBy: user,
      });
      const saved = await manager.save(aff);
      affidavits.push(saved);
    };

    // Husband proofs
    if (q.husband) {
      await createAff('Husband - Birth Date Proof Correction', q.husband.birthDateProof, dto.spouse1Name);
      await createAff('Husband - Residence Proof Correction', q.husband.residenceProof, dto.spouse1Name);
      await createAff('Husband - Identity Proof Correction', q.husband.identityProof, dto.spouse1Name);
    }

    // Wife proofs
    if (q.wife) {
      await createAff('Wife - Birth Date Proof Correction', q.wife.birthDateProof, dto.spouse2Name);
      await createAff('Wife - Residence Proof Correction', q.wife.residenceProof, dto.spouse2Name);
      await createAff('Wife - Identity Proof Correction', q.wife.identityProof, dto.spouse2Name);
    }

    // Wedding invitation (affidavit needed when it's NOT available)
    if (q.weddingInvitation && q.weddingInvitation.available === false) {
      await createAff('Wedding Invitation Affidavit', q.weddingInvitation, `${dto.spouse1Name} & ${dto.spouse2Name}`);
    }

    // First marriage (affidavit needed when it's NOT the first marriage)
    if (q.firstMarriage && q.firstMarriage.yes === false) {
      await createAff('Subsequent Marriage Affidavit', q.firstMarriage, q.firstMarriage.customerName || dto.contactName);
    }

    // Intercaste marriage
    if (q.intercasteMarriage && q.intercasteMarriage.yes === true) {
      await createAff('Intercaste Marriage Affidavit', q.intercasteMarriage, `${dto.spouse1Name} & ${dto.spouse2Name}`);
    }

    // Not Registered Anywhere Else
    if (q.notRegisteredAnywhereElse && q.notRegisteredAnywhereElse.yes === true) {
      await createAff('Not Registered Anywhere Else Affidavit', q.notRegisteredAnywhereElse, `${dto.spouse1Name} & ${dto.spouse2Name}`);
    }

    return affidavits;
  }

  async findAll(filter: MarriageFilterDto) {
    const qb = this.repo.createQueryBuilder('m')
      .leftJoinAndSelect('m.createdBy', 'u')
      .leftJoinAndSelect('m.customer', 'c')
      .leftJoinAndSelect('m.affidavits', 'aff')
      .leftJoinAndSelect('aff.createdBy', 'affUser')
      .leftJoinAndSelect('m.payments', 'p')
      .leftJoinAndSelect('p.createdBy', 'pu')
      .orderBy('m.dateOfService', 'DESC');

    if (filter.from) qb.andWhere('m.dateOfService >= :from', { from: filter.from });
    if (filter.to) qb.andWhere('m.dateOfService <= :to', { to: filter.to });
    if (filter.search) {
      qb.andWhere(
        '(LOWER(m.contactName) LIKE :s OR m.phone LIKE :s OR LOWER(m.spouse1Name) LIKE :s OR LOWER(m.spouse2Name) LIKE :s)',
        { s: `%${filter.search.toLowerCase()}%` },
      );
    }

    if (filter.page && filter.limit) {
      const page = Number(filter.page);
      const limit = Number(filter.limit);
      const [records, total] = await qb
        .take(limit)
        .skip((page - 1) * limit)
        .getManyAndCount();

      return {
        records,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Marriage> {
    const rec = await this.repo.findOne({
      where: { id },
      relations: ['createdBy', 'customer', 'affidavits', 'affidavits.createdBy', 'payments', 'payments.createdBy'],
    });
    if (!rec) throw new NotFoundException('Marriage record not found');
    return rec;
  }

  async update(id: string, dto: UpdateMarriageDto): Promise<Marriage> {
    const rec = await this.findOne(id);
    const { affidavitIds, ...rest } = dto;
    Object.assign(rec, rest);

    let phone = rec.phone;
    if (dto.phone !== undefined) {
      phone = dto.phone;
    }
    const contactName = dto.contactName || rec.contactName;
    const address = dto.address || rec.address;
    const contactEmail = dto.contactEmail || rec.contactEmail;

    if (phone && contactName) {
      const customer = await this.customersService.upsertByPhone(
        contactName,
        phone,
        address,
        contactEmail,
      );
      rec.customer = customer;
    } else if (!phone) {
      rec.customer = null;
    }

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

  async addPayment(dto: AddPaymentDto, user: User): Promise<MarriagePayment> {
    const { ticketId, marriageId, ...paymentData } = dto;
    if (!ticketId && !marriageId) {
      throw new BadRequestException('Either ticketId or marriageId must be provided');
    }

    let ticket: MarriageTicket | null = null;
    let marriage: Marriage | null = null;

    if (ticketId) {
      ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
      if (!ticket) throw new NotFoundException('Ticket not found');
    }
    if (marriageId) {
      marriage = await this.repo.findOne({ where: { id: marriageId } });
      if (!marriage) throw new NotFoundException('Marriage record not found');
    }

    const payment = this.paymentRepo.create({
      ...paymentData,
      ticket,
      marriage,
      createdBy: user,
    });
    return this.paymentRepo.save(payment);
  }

  async softDeletePayment(id: string): Promise<void> {
    const payment = await this.paymentRepo.findOne({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');
    await this.paymentRepo.softRemove(payment);
  }

  async findAllPayments(filter: PaymentFilterDto): Promise<MarriagePayment[]> {
    const qb = this.paymentRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.createdBy', 'u')
      .leftJoinAndSelect('p.ticket', 't')
      .leftJoinAndSelect('p.marriage', 'm')
      .orderBy('p.paymentDate', 'DESC')
      .addOrderBy('p.createdAt', 'DESC');

    if (filter.paymentMode) {
      qb.andWhere('p.paymentMode = :paymentMode', { paymentMode: filter.paymentMode });
    }

    if (filter.account) {
      qb.andWhere('p.account = :account', { account: filter.account });
    }

    if (filter.search) {
      qb.andWhere(
        '(LOWER(t.ticketNumber) LIKE :s OR LOWER(t.contactName) LIKE :s OR LOWER(m.contactName) LIKE :s OR LOWER(u.name) LIKE :s)',
        { s: `%${filter.search.toLowerCase()}%` },
      );
    }

    return qb.getMany();
  }

  async getDashboardMetrics(from: string, to: string): Promise<ServiceMetricsResult> {
    const records = await this.repo.createQueryBuilder('m')
      .leftJoin('m.createdBy', 'u')
      .leftJoin('m.affidavits', 'a')
      .select([
        'm.id',
        'm.createdAt',
        'm.dateOfService',
        'm.amountCharged',
        'm.officialFee',
        'm.courtFeeTickets',
        'm.marriageAct',
        'u.id',
        'u.name',
        'a.id',
        'a.amountCharged',
      ])
      .where('m.dateOfService >= :from AND m.dateOfService <= :to', { from, to })
      .getMany();

    let count = 0;
    let gross = 0;
    let net = 0;
    const dailyMap = new Map<string, number>();
    const userMap = new Map<string, { userId: string; userName: string; gross: number; net: number }>();
    const actMap = new Map<string, number>();

    for (const m of records) {
      count++;

      const cutOffDate = new Date('2026-07-05T12:00:00Z');
      const isOldRecord = m.createdAt ? new Date(m.createdAt) < cutOffDate : false;
      const affidavitsSum = isOldRecord
        ? (m.affidavits?.reduce((sum, aff) => sum + Number(aff.amountCharged || 0), 0) || 0)
        : 0;
      const grossVal = Number(m.amountCharged || 0) - affidavitsSum;
      gross += grossVal;

      const netVal = grossVal - Number(m.officialFee || 0) - Number(m.courtFeeTickets || 0);
      net += netVal;

      const dateVal = m.dateOfService as any;
      const dateStr = dateVal instanceof Date ? dateVal.toISOString().split('T')[0] : String(dateVal).split('T')[0];
      dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + netVal);

      const uid = m.createdBy?.id || 'unknown';
      const uname = m.createdBy?.name || 'Unknown User';
      if (!userMap.has(uid)) {
        userMap.set(uid, { userId: uid, userName: uname, gross: 0, net: 0 });
      }
      const userStat = userMap.get(uid)!;
      userStat.gross += grossVal;
      userStat.net += netVal;

      const act = m.marriageAct;
      if (act) {
        actMap.set(act, (actMap.get(act) || 0) + 1);
      }
    }

    const daily = Array.from(dailyMap.entries()).map(([date, net]) => ({ date, net }));
    const userBreakdown = Array.from(userMap.values());
    const byAct = Array.from(actMap.entries()).map(([marriageAct, count]) => ({ marriageAct, count }));

    return {
      key: 'marriages',
      label: 'Marriage Registration',
      category: 'KMC',
      count,
      gross,
      net,
      daily,
      userBreakdown,
      extra: { byAct },
    };
  }

  async getCustomerHistory(customerId: string): Promise<CustomerHistoryItem[]> {
    const records = await this.repo.find({
      where: { customer: { id: customerId } },
      relations: ['createdBy'],
    });

    return records.map(m => ({
      id: m.id,
      type: 'marriage',
      typeName: 'Marriage Registration',
      dateOfService: m.dateOfService,
      amountCharged: Number(m.amountCharged),
      description: `Marriage between ${m.spouse1Name} & ${m.spouse2Name} (${m.marriageAct})`,
      createdBy: m.createdBy?.name || 'Unknown',
      createdAt: m.createdAt,
    }));
  }
}
