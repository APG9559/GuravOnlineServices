import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThanOrEqual } from 'typeorm';
import { Marriage } from './marriage.entity';
import { MarriageTicket, TicketStatus } from './marriage-ticket.entity';
import { Affidavit } from '../affidavits/affidavit.entity';
import {
  CreateMarriageDto, UpdateMarriageDto, MarriageFilterDto,
  CreateMarriageTicketDto, TicketFilterDto,
} from './marriages.dto';
import { User } from '../users/user.entity';
import { CustomersService } from '../customers/customers.service';
import { PaperType, AuthorizerType } from '../common/enums';

@Injectable()
export class MarriagesService {
  constructor(
    @InjectRepository(Marriage)
    private readonly repo: Repository<Marriage>,
    @InjectRepository(Affidavit)
    private readonly affRepo: Repository<Affidavit>,
    @InjectRepository(MarriageTicket)
    private readonly ticketRepo: Repository<MarriageTicket>,
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

  async confirmTicket(id: string): Promise<MarriageTicket> {
    const ticket = await this.ticketRepo.findOne({ where: { id }, relations: ['createdBy'] });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.status !== TicketStatus.INQUIRED) {
      throw new BadRequestException(`Cannot confirm a ticket with status "${ticket.status}"`);
    }
    ticket.status = TicketStatus.CONFIRMED;
    return this.ticketRepo.save(ticket);
  }

  async findAllTickets(filter: TicketFilterDto): Promise<MarriageTicket[]> {
    const qb = this.ticketRepo.createQueryBuilder('t')
      .leftJoinAndSelect('t.createdBy', 'u')
      .leftJoinAndSelect('t.marriage', 'm')
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
      relations: ['createdBy', 'marriage'],
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  // ── Marriage CRUD ───────────────────────────────────────────────────────

  async create(dto: CreateMarriageDto, user: User): Promise<Marriage> {
    const { affidavitIds, ticketId, ...rest } = dto;

    const customer = await this.customersService.upsertByPhone(
      dto.contactName,
      dto.phone,
      dto.address,
      dto.contactEmail,
    );

    const record = this.repo.create({ ...rest, createdBy: user, customer });

    // ── Handle linked affidavits (manual or auto-generated) ──────────────
    const allAffidavits: Affidavit[] = [];

    // 1. Manually linked affidavits
    if (affidavitIds && affidavitIds.length > 0) {
      const manualAffs = await this.affRepo.findBy({ id: In(affidavitIds) });
      if (manualAffs.length !== affidavitIds.length) {
        throw new NotFoundException('Some linked affidavits were not found');
      }
      allAffidavits.push(...manualAffs);
    }

    // 2. Auto-generate affidavits from ticket questionnaire
    if (ticketId) {
      const ticket = await this.ticketRepo.findOne({ where: { id: ticketId }, relations: ['createdBy'] });
      if (!ticket) throw new NotFoundException('Ticket not found');
      if (ticket.status !== TicketStatus.CONFIRMED) {
        throw new BadRequestException('Ticket must be in Confirmed status to complete');
      }

      const autoAffs = await this.generateAffidavitsFromQuestionnaire(
        ticket.questionnaireData,
        dto.contactName,
        dto.phone,
        dto.dateOfService,
        customer,
        user,
      );
      allAffidavits.push(...autoAffs);

      // Mark ticket as completed
      ticket.status = TicketStatus.COMPLETED;
      // Save marriage first, then link it
      record.affidavits = allAffidavits;
      const savedMarriage = await this.repo.save(record);
      ticket.marriage = savedMarriage;
      await this.ticketRepo.save(ticket);
      return savedMarriage;
    }

    record.affidavits = allAffidavits;
    return this.repo.save(record);
  }

  private async generateAffidavitsFromQuestionnaire(
    q: Record<string, any>,
    customerName: string,
    phone: string,
    dateOfService: string,
    customer: any,
    user: User,
  ): Promise<Affidavit[]> {
    const affidavits: Affidavit[] = [];

    // Helper to create an affidavit from a proof entry
    const createAff = async (purpose: string, entry: any) => {
      if (!entry || entry.correct === true || entry.affidavit !== 'Yes') return;

      const paperType = entry.paperType === 'stamp500' ? PaperType.STAMP500 : PaperType.PLAIN;
      const authorizerType = entry.authorizer === 'magistrate' ? AuthorizerType.MAGISTRATE : AuthorizerType.NOTARY;
      const amountCharged = entry.amountCharged ?? 0;

      const aff = this.affRepo.create({
        customerName,
        phone,
        purpose,
        paperType,
        authorizerType,
        dateOfService,
        amountCharged,
        customer,
        createdBy: user,
      });
      const saved = await this.affRepo.save(aff);
      affidavits.push(saved);
    };

    // Husband proofs
    if (q.husband) {
      await createAff('Husband - Birth Date Proof Correction', q.husband.birthDateProof);
      await createAff('Husband - Residence Proof Correction', q.husband.residenceProof);
      await createAff('Husband - Identity Proof Correction', q.husband.identityProof);
    }

    // Wife proofs
    if (q.wife) {
      await createAff('Wife - Birth Date Proof Correction', q.wife.birthDateProof);
      await createAff('Wife - Residence Proof Correction', q.wife.residenceProof);
      await createAff('Wife - Identity Proof Correction', q.wife.identityProof);
    }

    // Wedding invitation
    if (q.weddingInvitation && q.weddingInvitation.available === true) {
      await createAff('Wedding Invitation Affidavit', q.weddingInvitation);
    }

    // First marriage (affidavit needed when it's NOT the first marriage)
    if (q.firstMarriage && q.firstMarriage.yes === false) {
      await createAff('Subsequent Marriage Affidavit', q.firstMarriage);
    }

    // Intercaste marriage
    if (q.intercasteMarriage && q.intercasteMarriage.yes === true) {
      await createAff('Intercaste Marriage Affidavit', q.intercasteMarriage);
    }

    return affidavits;
  }

  async findAll(filter: MarriageFilterDto) {
    const qb = this.repo.createQueryBuilder('m')
      .leftJoinAndSelect('m.createdBy', 'u')
      .leftJoinAndSelect('m.customer', 'c')
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
      relations: ['createdBy', 'customer', 'affidavits', 'affidavits.createdBy'],
    });
    if (!rec) throw new NotFoundException('Marriage record not found');
    return rec;
  }

  async update(id: string, dto: UpdateMarriageDto): Promise<Marriage> {
    const rec = await this.findOne(id);
    const { affidavitIds, ...rest } = dto;
    Object.assign(rec, rest);

    const phone = dto.phone || rec.phone;
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
}
