import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { CreateCustomerDto, UpdateCustomerDto, CustomerFilterDto } from './customers.dto';
import { ICustomerHistoryProvider, CUSTOMER_HISTORY_PROVIDER } from '../common/interfaces/customer-history.interface';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly repo: Repository<Customer>,

    @Inject(CUSTOMER_HISTORY_PROVIDER)
    private readonly historyProviders: ICustomerHistoryProvider[],
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

  async findAll(filter: CustomerFilterDto): Promise<Customer[]> {
    const qb = this.repo.createQueryBuilder('c')
      .orderBy('c.name', 'ASC');

    if (filter.search) {
      qb.andWhere('(LOWER(c.name) LIKE :s OR c.phone LIKE :s OR LOWER(c.address) LIKE :s)', {
        s: `%${filter.search.toLowerCase()}%`,
      });
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
    phone: string,
    address?: string | null,
    email?: string | null,
  ): Promise<Customer> {
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

  async getCustomerDetails(id: string) {
    const customer = await this.findOne(id);

    // Fetch all service records linked to this customer via providers
    const providerResults = await Promise.all(
      this.historyProviders.map(p => p.getCustomerHistory(id)),
    );

    const services = providerResults.flat();

    // Sort services by dateOfService descending, falling back to createdAt
    services.sort((a, b) => {
      const dateDiff = new Date(b.dateOfService).getTime() - new Date(a.dateOfService).getTime();
      if (dateDiff !== 0) return dateDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return {
      ...customer,
      services,
    };
  }
}
