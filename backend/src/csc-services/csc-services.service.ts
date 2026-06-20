import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PanCardRecord } from './pan-card.entity';
import { PassportRecord } from './passport.entity';
import { VoterCardRecord } from './voter-card.entity';
import {
  CreatePanCardDto, UpdatePanCardDto,
  CreatePassportDto, UpdatePassportDto,
  CreateVoterCardDto, UpdateVoterCardDto,
  CscFilterDto,
} from './csc-services.dto';
import { User } from '../users/user.entity';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class CscServicesService {
  constructor(
    @InjectRepository(PanCardRecord)
    private readonly panRepo: Repository<PanCardRecord>,
    @InjectRepository(PassportRecord)
    private readonly passportRepo: Repository<PassportRecord>,
    @InjectRepository(VoterCardRecord)
    private readonly voterRepo: Repository<VoterCardRecord>,
    private readonly customersService: CustomersService,
  ) {}

  // ── PAN Card Records ───────────────────────────────────────────────────────

  async createPanCard(dto: CreatePanCardDto, user: User): Promise<PanCardRecord> {
    const customer = await this.customersService.upsertByPhone(dto.customerName, dto.phone);
    const record = this.panRepo.create({ ...dto, createdBy: user, customer });
    return this.panRepo.save(record);
  }

  async findAllPanCards(filter: CscFilterDto): Promise<PanCardRecord[]> {
    const qb = this.panRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.createdBy', 'u')
      .leftJoinAndSelect('p.customer', 'c')
      .orderBy('p.dateOfService', 'DESC')
      .addOrderBy('p.createdAt', 'DESC');

    if (filter.from)       qb.andWhere('p.dateOfService >= :from', { from: filter.from });
    if (filter.to)         qb.andWhere('p.dateOfService <= :to',   { to: filter.to });
    if (filter.search) {
      qb.andWhere(
        '(LOWER(p.customerName) LIKE :s OR p.phone LIKE :s OR LOWER(p.ackNo) LIKE :s)',
        { s: `%${filter.search.toLowerCase()}%` },
      );
    }

    return qb.getMany();
  }

  async findOnePanCard(id: string): Promise<PanCardRecord> {
    const rec = await this.panRepo.findOne({ where: { id }, relations: ['createdBy', 'customer'] });
    if (!rec) throw new NotFoundException('PAN card record not found');
    return rec;
  }

  async updatePanCard(id: string, dto: UpdatePanCardDto): Promise<PanCardRecord> {
    const rec = await this.findOnePanCard(id);
    Object.assign(rec, dto);

    const phone = dto.phone || rec.phone;
    const customerName = dto.customerName || rec.customerName;
    if (phone && customerName) {
      const customer = await this.customersService.upsertByPhone(customerName, phone);
      rec.customer = customer;
    }

    return this.panRepo.save(rec);
  }

  async deletePanCard(id: string): Promise<void> {
    const rec = await this.findOnePanCard(id);
    await this.panRepo.softRemove(rec);
  }

  // ── Passport Records ────────────────────────────────────────────────────────

  async createPassport(dto: CreatePassportDto, user: User): Promise<PassportRecord> {
    const customer = await this.customersService.upsertByPhone(dto.customerName, dto.phone);
    const record = this.passportRepo.create({ ...dto, createdBy: user, customer });
    return this.passportRepo.save(record);
  }

  async findAllPassports(filter: CscFilterDto): Promise<PassportRecord[]> {
    const qb = this.passportRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.createdBy', 'u')
      .leftJoinAndSelect('p.customer', 'c')
      .orderBy('p.dateOfService', 'DESC')
      .addOrderBy('p.createdAt', 'DESC');

    if (filter.from)       qb.andWhere('p.dateOfService >= :from', { from: filter.from });
    if (filter.to)         qb.andWhere('p.dateOfService <= :to',   { to: filter.to });
    if (filter.search) {
      qb.andWhere(
        '(LOWER(p.customerName) LIKE :s OR p.phone LIKE :s OR LOWER(p.fileNo) LIKE :s)',
        { s: `%${filter.search.toLowerCase()}%` },
      );
    }

    return qb.getMany();
  }

  async findOnePassport(id: string): Promise<PassportRecord> {
    const rec = await this.passportRepo.findOne({ where: { id }, relations: ['createdBy', 'customer'] });
    if (!rec) throw new NotFoundException('Passport record not found');
    return rec;
  }

  async updatePassport(id: string, dto: UpdatePassportDto): Promise<PassportRecord> {
    const rec = await this.findOnePassport(id);
    Object.assign(rec, dto);

    const phone = dto.phone || rec.phone;
    const customerName = dto.customerName || rec.customerName;
    if (phone && customerName) {
      const customer = await this.customersService.upsertByPhone(customerName, phone);
      rec.customer = customer;
    }

    return this.passportRepo.save(rec);
  }

  async deletePassport(id: string): Promise<void> {
    const rec = await this.findOnePassport(id);
    await this.passportRepo.softRemove(rec);
  }

  // ── Voter Card Records ─────────────────────────────────────────────────────

  async createVoterCard(dto: CreateVoterCardDto, user: User): Promise<VoterCardRecord> {
    const customer = await this.customersService.upsertByPhone(dto.customerName, dto.phone);
    const record = this.voterRepo.create({ ...dto, createdBy: user, customer });
    return this.voterRepo.save(record);
  }

  async findAllVoterCards(filter: CscFilterDto): Promise<VoterCardRecord[]> {
    const qb = this.voterRepo.createQueryBuilder('v')
      .leftJoinAndSelect('v.createdBy', 'u')
      .leftJoinAndSelect('v.customer', 'c')
      .orderBy('v.dateOfService', 'DESC')
      .addOrderBy('v.createdAt', 'DESC');

    if (filter.from)       qb.andWhere('v.dateOfService >= :from', { from: filter.from });
    if (filter.to)         qb.andWhere('v.dateOfService <= :to',   { to: filter.to });
    if (filter.search) {
      qb.andWhere(
        '(LOWER(v.customerName) LIKE :s OR v.phone LIKE :s OR LOWER(v.epicNo) LIKE :s OR LOWER(v.tokenNo) LIKE :s)',
        { s: `%${filter.search.toLowerCase()}%` },
      );
    }

    return qb.getMany();
  }

  async findOneVoterCard(id: string): Promise<VoterCardRecord> {
    const rec = await this.voterRepo.findOne({ where: { id }, relations: ['createdBy', 'customer'] });
    if (!rec) throw new NotFoundException('Voter card record not found');
    return rec;
  }

  async updateVoterCard(id: string, dto: UpdateVoterCardDto): Promise<VoterCardRecord> {
    const rec = await this.findOneVoterCard(id);
    Object.assign(rec, dto);

    // If application type is changed, make sure to clean the fields appropriately
    if (dto.applicationType === 'New') {
      rec.epicNo = null;
    } else if (dto.applicationType) {
      rec.tokenNo = null;
    }

    const phone = dto.phone || rec.phone;
    const customerName = dto.customerName || rec.customerName;
    if (phone && customerName) {
      const customer = await this.customersService.upsertByPhone(customerName, phone);
      rec.customer = customer;
    }

    return this.voterRepo.save(rec);
  }

  async deleteVoterCard(id: string): Promise<void> {
    const rec = await this.findOneVoterCard(id);
    await this.voterRepo.softRemove(rec);
  }
}
