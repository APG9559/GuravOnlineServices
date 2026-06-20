import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { CreateCustomerDto, UpdateCustomerDto, CustomerFilterDto } from './customers.dto';
import { Affidavit } from '../affidavits/affidavit.entity';
import { Marriage } from '../marriages/marriage.entity';
import { BirthDeathCertificate } from '../birth-death-certificates/birth-death-certificate.entity';
import { PropertyCard } from '../property-cards/property-card.entity';
import { ShopActLicense } from '../shop-act-licenses/shop-act-license.entity';
import { TradeLicenseRecord } from '../trade-licenses/trade-license-record.entity';
import { Gazette } from '../gazettes/gazette.entity';
import { PanCardRecord } from '../csc-services/pan-card.entity';
import { PassportRecord } from '../csc-services/passport.entity';
import { WaterSupply } from '../water-supply/water-supply.entity';
import { PropertyTax } from '../property-tax/property-tax.entity';
import { VoterCardRecord } from '../csc-services/voter-card.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly repo: Repository<Customer>,

    @InjectRepository(Affidavit)
    private readonly affidavitRepo: Repository<Affidavit>,

    @InjectRepository(Marriage)
    private readonly marriageRepo: Repository<Marriage>,

    @InjectRepository(BirthDeathCertificate)
    private readonly birthDeathRepo: Repository<BirthDeathCertificate>,

    @InjectRepository(PropertyCard)
    private readonly propertyCardRepo: Repository<PropertyCard>,

    @InjectRepository(ShopActLicense)
    private readonly shopActRepo: Repository<ShopActLicense>,

    @InjectRepository(TradeLicenseRecord)
    private readonly tradeLicenseRepo: Repository<TradeLicenseRecord>,

    @InjectRepository(Gazette)
    private readonly gazetteRepo: Repository<Gazette>,

    @InjectRepository(PanCardRecord)
    private readonly panCardRepo: Repository<PanCardRecord>,

    @InjectRepository(PassportRecord)
    private readonly passportRepo: Repository<PassportRecord>,

    @InjectRepository(WaterSupply)
    private readonly waterSupplyRepo: Repository<WaterSupply>,

    @InjectRepository(PropertyTax)
    private readonly propertyTaxRepo: Repository<PropertyTax>,

    @InjectRepository(VoterCardRecord)
    private readonly voterCardRepo: Repository<VoterCardRecord>,
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

    // Fetch all service records linked to this customer
    const [
      affidavits, marriages, birthDeathCertificates, propertyCards, shopActLicenses,
      tradeLicenses, gazettes, panCards, passports, voterCards, waterSupplies, propertyTaxes
    ] = await Promise.all([
      this.affidavitRepo.find({ where: { customer: { id } }, relations: ['createdBy'] }),
      this.marriageRepo.find({ where: { customer: { id } }, relations: ['createdBy'] }),
      this.birthDeathRepo.find({ where: { customer: { id } }, relations: ['createdBy'] }),
      this.propertyCardRepo.find({ where: { customer: { id } }, relations: ['createdBy'] }),
      this.shopActRepo.find({ where: { customer: { id } }, relations: ['createdBy'] }),
      this.tradeLicenseRepo.createQueryBuilder('r')
        .leftJoinAndSelect('r.business', 'b')
        .leftJoin('b.customers', 'c')
        .leftJoinAndSelect('r.createdBy', 'u')
        .where('c.id = :id', { id })
        .getMany(),
      this.gazetteRepo.find({ where: { customer: { id } }, relations: ['createdBy'] }),
      this.panCardRepo.find({ where: { customer: { id } }, relations: ['createdBy'] }),
      this.passportRepo.find({ where: { customer: { id } }, relations: ['createdBy'] }),
      this.voterCardRepo.find({ where: { customer: { id } }, relations: ['createdBy'] }),
      this.waterSupplyRepo.find({ where: { customer: { id } }, relations: ['createdBy'] }),
      this.propertyTaxRepo.find({ where: { customer: { id } }, relations: ['createdBy'] }),
    ]);

    // Map each to a generic service history type
    const services: any[] = [
      ...affidavits.map(a => ({
        id: a.id,
        type: 'affidavit',
        typeName: 'Affidavit / Notary',
        dateOfService: a.dateOfService,
        amountCharged: Number(a.amountCharged),
        description: `Purpose: ${a.purpose} (${a.paperType === 'stamp500' ? '₹500 Stamp' : 'Plain'}, ${a.authorizerType})`,
        createdBy: a.createdBy?.name || 'Unknown',
        createdAt: a.createdAt,
      })),
      ...marriages.map(m => ({
        id: m.id,
        type: 'marriage',
        typeName: 'Marriage Registration',
        dateOfService: m.dateOfService,
        amountCharged: Number(m.amountCharged),
        description: `Marriage between ${m.spouse1Name} & ${m.spouse2Name} (${m.marriageAct})`,
        createdBy: m.createdBy?.name || 'Unknown',
        createdAt: m.createdAt,
      })),
      ...birthDeathCertificates.map(b => ({
        id: b.id,
        type: 'birth-death',
        typeName: `${b.certificateType} Certificate`,
        dateOfService: b.dateOfService,
        amountCharged: Number(b.amountCharged),
        description: `${b.certificateType} certificate for ${b.personName} (Copies: ${b.numberOfCopies})`,
        createdBy: b.createdBy?.name || 'Unknown',
        createdAt: b.createdAt,
      })),
      ...propertyCards.map(p => ({
        id: p.id,
        type: 'property-card',
        typeName: p.recordType,
        dateOfService: p.dateOfService,
        amountCharged: Number(p.amountCharged),
        description: `${p.recordType} - Property No: ${p.propertyNumber}`,
        createdBy: p.createdBy?.name || 'Unknown',
        createdAt: p.createdAt,
      })),
      ...shopActLicenses.map(s => ({
        id: s.id,
        type: 'shop-act',
        typeName: 'Shop Act License',
        dateOfService: s.dateOfService,
        amountCharged: Number(s.amountCharged),
        description: `License for ${s.businessName}`,
        createdBy: s.createdBy?.name || 'Unknown',
        createdAt: s.createdAt,
      })),
      ...tradeLicenses.map(t => ({
        id: t.id,
        type: 'trade-license',
        typeName: `Trade License (${t.serviceType})`,
        dateOfService: t.dateOfService,
        amountCharged: Number(t.amountCharged),
        description: `Business: ${t.business?.name || 'Unknown'} (${t.serviceType})`,
        createdBy: t.createdBy?.name || 'Unknown',
        createdAt: t.createdAt,
      })),
      ...gazettes.map(g => ({
        id: g.id,
        type: 'gazette',
        typeName: 'Gazette Name Change',
        dateOfService: g.dateOfService,
        amountCharged: Number(g.amountCharged),
        description: `Name Change: ${g.oldName} → ${g.newName} (Reason: ${g.reasonToChangeName})`,
        createdBy: g.createdBy?.name || 'Unknown',
        createdAt: g.createdAt,
      })),
      ...panCards.map(p => ({
        id: p.id,
        type: 'pan-card',
        typeName: 'PAN Card',
        dateOfService: p.dateOfService,
        amountCharged: Number(p.amountCharged),
        description: `PAN Application (${p.applicationType}) - Ack: ${p.ackNo || 'N/A'}`,
        createdBy: p.createdBy?.name || 'Unknown',
        createdAt: p.createdAt,
      })),
      ...passports.map(p => ({
        id: p.id,
        type: 'passport',
        typeName: 'Passport',
        dateOfService: p.dateOfService,
        amountCharged: Number(p.amountCharged),
        description: `Passport Application (${p.applicationType}) - File No: ${p.fileNo || 'N/A'}`,
        createdBy: p.createdBy?.name || 'Unknown',
        createdAt: p.createdAt,
      })),
      ...voterCards.map(v => ({
        id: v.id,
        type: 'voter-card',
        typeName: 'Voter Card',
        dateOfService: v.dateOfService,
        amountCharged: Number(v.amountCharged),
        description: v.applicationType === 'New'
          ? `Voter Card Application (${v.applicationType}) - Token: ${v.tokenNo || 'N/A'}`
          : `Voter Card Application (${v.applicationType}) - EPIC No: ${v.epicNo || 'N/A'}`,
        createdBy: v.createdBy?.name || 'Unknown',
        createdAt: v.createdAt,
      })),
      ...waterSupplies.map(ws => {
        let desc = `Token: ${ws.applicationTokenNo}`;
        if (ws.connectionNo) {
          desc += `, Connection No: ${ws.connectionNo}`;
        }
        if (ws.serviceType === 'NewConnection') {
          desc += `, Plumber: ${ws.plumberName || '—'}`;
        } else if (ws.serviceType === 'ConnectionTransfer') {
          desc += `, Owner Transfer: ${ws.currentOwner || '—'} → ${ws.newOwnerName || '—'} (${ws.transferSubtype || '—'})`;
        } else if (ws.serviceType === 'ChangeOfUse') {
          desc += `, Use: ${ws.currentUsage || '—'} → ${ws.newUsage || '—'}`;
        }
        return {
          id: ws.id,
          type: 'water-supply',
          typeName: `Water Supply - ${ws.serviceType}`,
          dateOfService: ws.dateOfService,
          amountCharged: Number(ws.amountCharged),
          description: desc,
          createdBy: ws.createdBy?.name || 'Unknown',
          createdAt: ws.createdAt,
        };
      }),
      ...propertyTaxes.map(pt => ({
        id: pt.id,
        type: 'property-tax',
        typeName: `Property Tax - ${pt.serviceType}`,
        dateOfService: pt.dateOfService,
        amountCharged: Number(pt.amountCharged),
        description: `Property Tax No: ${pt.propertyTaxNo}, Address: ${pt.address}`,
        createdBy: pt.createdBy?.name || 'Unknown',
        createdAt: pt.createdAt,
      })),
    ];

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
