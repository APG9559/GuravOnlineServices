import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WaterSupply } from './water-supply.entity';
import {
  CreateWaterSupplyDto,
  UpdateWaterSupplyDto,
  WaterSupplyFilterDto,
} from './water-supply.dto';
import { User } from '../users/user.entity';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class WaterSupplyService {
  constructor(
    @InjectRepository(WaterSupply)
    private readonly repo: Repository<WaterSupply>,
    private readonly customersService: CustomersService,
  ) {}

  async create(dto: CreateWaterSupplyDto, user: User): Promise<WaterSupply> {
    const customer = await this.customersService.upsertByPhone(dto.customerName, dto.phone, dto.connectionAddress);
    const record = this.repo.create({ ...dto, createdBy: user, customer });
    return this.repo.save(record);
  }

  async findAll(filter: WaterSupplyFilterDto) {
    const qb = this.repo.createQueryBuilder('ws')
      .leftJoinAndSelect('ws.createdBy', 'u')
      .leftJoinAndSelect('ws.customer', 'c')
      .orderBy('ws.dateOfService', 'DESC');

    if (filter.from)       qb.andWhere('ws.dateOfService >= :from', { from: filter.from });
    if (filter.to)         qb.andWhere('ws.dateOfService <= :to',   { to: filter.to });
    if (filter.search) {
      qb.andWhere(
        '(LOWER(ws.customerName) LIKE :s OR ws.phone LIKE :s OR ws.applicationTokenNo LIKE :s OR ws.connectionNo LIKE :s OR LOWER(ws.connectionAddress) LIKE :s)',
        { s: `%${filter.search.toLowerCase()}%` },
      );
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<WaterSupply> {
    const rec = await this.repo.findOne({ where: { id }, relations: ['createdBy', 'customer'] });
    if (!rec) throw new NotFoundException('Water Supply record not found');
    return rec;
  }

  async update(id: string, dto: UpdateWaterSupplyDto): Promise<WaterSupply> {
    const rec = await this.findOne(id);
    Object.assign(rec, dto);

    const phone = dto.phone || rec.phone;
    const customerName = dto.customerName || rec.customerName;
    const address = dto.connectionAddress || rec.connectionAddress;
    if (phone && customerName) {
      const customer = await this.customersService.upsertByPhone(customerName, phone, address);
      rec.customer = customer;
    }

    return this.repo.save(rec);
  }

  async softDelete(id: string): Promise<void> {
    const rec = await this.findOne(id);
    await this.repo.softRemove(rec);
  }
}
