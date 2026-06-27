import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { CustomersService } from '../customers/customers.service';

export abstract class BaseRecordService<T> {
  constructor(
    protected readonly repo: Repository<T>,
    protected readonly customersService: CustomersService,
    protected readonly entityName: string,
  ) {}

  async create(dto: any, user: User): Promise<T> {
    const address = dto.connectionAddress || dto.address || null;
    const email = dto.email || dto.contactEmail || null;
    const customer = await this.customersService.upsertByPhone(
      dto.customerName,
      dto.phone,
      address,
      email,
    );
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

    const phone = dto.phone || (rec as any).phone;
    const customerName = dto.customerName || (rec as any).customerName;
    const address = dto.connectionAddress || dto.address || (rec as any).connectionAddress || (rec as any).address || null;
    const email = dto.email || dto.contactEmail || (rec as any).email || (rec as any).contactEmail || null;

    if (phone && customerName) {
      const customer = await this.customersService.upsertByPhone(customerName, phone, address, email);
      (rec as any).customer = customer;
    }

    return this.repo.save(rec as any) as Promise<T>;
  }

  async softDelete(id: string): Promise<void> {
    const rec = await this.findOne(id);
    await this.repo.softRemove(rec);
  }
}
