import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { CreateCustomerDto, UpdateCustomerDto, CustomerFilterDto } from './customers.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly repo: Repository<Customer>,
  ) {}

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const existing = await this.repo.findOne({ where: { phone: dto.phone } });
    if (existing) {
      Object.assign(existing, dto);
      return this.repo.save(existing);
    }
    const customer = this.repo.create(dto);
    return this.repo.save(customer);
  }

  async findAll(filter: CustomerFilterDto): Promise<any> {
    const qb = this.repo.createQueryBuilder('c')
      .orderBy('c.name', 'ASC');

    if (filter.search) {
      qb.andWhere('(LOWER(c.name) LIKE :s OR c.phone LIKE :s OR LOWER(c.address) LIKE :s)', {
        s: `%${filter.search.toLowerCase()}%`,
      });
    }

    if (filter.page && filter.limit) {
      const page = Number(filter.page);
      const limit = Number(filter.limit);
      const [data, total] = await qb
        .take(limit)
        .skip((page - 1) * limit)
        .getManyAndCount();

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.repo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async lookup(phone: string): Promise<Customer> {
    const customer = await this.repo.findOne({ where: { phone } });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async upsertByPhone(
    name: string,
    phone?: string | null,
    address?: string | null,
    email?: string | null,
  ): Promise<Customer | null> {
    if (!phone) return null;
    let customer = await this.repo.findOne({ where: { phone } });
    if (customer) {
      customer.name = name;
      if (address !== undefined) customer.address = address;
      if (email !== undefined) customer.email = email;
      return this.repo.save(customer);
    } else {
      customer = this.repo.create({ name, phone, address, email });
      return this.repo.save(customer);
    }
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);
    Object.assign(customer, dto);
    return this.repo.save(customer);
  }

  async softDelete(id: string): Promise<void> {
    const customer = await this.findOne(id);
    await this.repo.softRemove(customer);
  }

}

