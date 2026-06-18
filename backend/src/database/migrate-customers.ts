import 'reflect-metadata';
import * as path from 'path';

try {
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
} catch {
  // running in prod container — env vars supplied externally
}

import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import { Affidavit } from '../affidavits/affidavit.entity';
import { Marriage } from '../marriages/marriage.entity';
import { BirthDeathCertificate } from '../birth-death-certificates/birth-death-certificate.entity';
import { PropertyCard } from '../property-cards/property-card.entity';
import { ShopActLicense } from '../shop-act-licenses/shop-act-license.entity';
import { Customer } from '../customers/customer.entity';
import { PricingSetting } from '../settings/pricing-setting.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'familystore',
  entities: [User, Affidavit, Marriage, BirthDeathCertificate, PropertyCard, ShopActLicense, PricingSetting, Customer],
  synchronize: true, // ensure customer table and columns are created
});

interface TempCustomerInfo {
  name: string;
  phone: string;
  address?: string | null;
  email?: string | null;
  latestDate: Date;
}

async function migrate() {
  console.log('\n🏃  Gurav Online Services — Customers Database Migration');
  console.log('───────────────────────────────────────────────────────');

  await dataSource.initialize();
  console.log('✅  Connected to PostgreSQL');

  const customerRepo = dataSource.getRepository(Customer);
  const affidavitRepo = dataSource.getRepository(Affidavit);
  const marriageRepo = dataSource.getRepository(Marriage);
  const birthDeathRepo = dataSource.getRepository(BirthDeathCertificate);
  const propertyCardRepo = dataSource.getRepository(PropertyCard);
  const shopActRepo = dataSource.getRepository(ShopActLicense);

  // 1. Fetch all records
  console.log('📥  Fetching existing service records...');
  const [affidavits, marriages, birthDeathCerts, propertyCards, shopActLicenses] = await Promise.all([
    affidavitsApiList(affidavitRepo),
    marriagesApiList(marriageRepo),
    birthDeathApiList(birthDeathRepo),
    propertyCardsApiList(propertyCardRepo),
    shopActApiList(shopActRepo),
  ]);

  console.log(`    - Affidavits: ${affidavits.length}`);
  console.log(`    - Marriages: ${marriages.length}`);
  console.log(`    - Birth/Death Certificates: ${birthDeathCerts.length}`);
  console.log(`    - Property Cards: ${propertyCards.length}`);
  console.log(`    - Shop Act Licenses: ${shopActLicenses.length}`);

  // Combine and group by phone
  const recordsByPhone: Record<string, TempCustomerInfo[]> = {};

  const addRecord = (name: string, phone: string, address: string | null = null, email: string | null = null, dateOfService: string, createdAt: Date) => {
    // Basic normalization: trim and keep only digits if valid phone
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 10) return; // ignore invalid phones

    const latestDate = new Date(dateOfService || createdAt || new Date());
    if (!recordsByPhone[cleanPhone]) {
      recordsByPhone[cleanPhone] = [];
    }
    recordsByPhone[cleanPhone].push({
      name: name.trim(),
      phone: cleanPhone,
      address: address ? address.trim() : null,
      email: email ? email.trim() : null,
      latestDate,
    });
  };

  affidavits.forEach(a => addRecord(a.customerName, a.phone, null, null, a.dateOfService, a.createdAt));
  marriages.forEach(m => addRecord(m.contactName, m.phone, m.address || null, m.contactEmail || null, m.dateOfService, m.createdAt));
  birthDeathCerts.forEach(b => addRecord(b.customerName, b.phone, null, null, b.dateOfService, b.createdAt));
  propertyCards.forEach(p => addRecord(p.customerName, p.phone, null, null, p.dateOfService, p.createdAt));
  shopActLicenses.forEach(s => addRecord(s.customerName, s.phone, null, s.email || null, s.dateOfService, s.createdAt));

  const phones = Object.keys(recordsByPhone);
  console.log(`👥  Found ${phones.length} unique customers (by phone number).`);

  // 2. Insert or update Customers in database
  console.log('💾  Creating/upserting customers...');
  const customerMap: Record<string, Customer> = {};

  for (const phone of phones) {
    const list = recordsByPhone[phone];
    // Sort latest first
    list.sort((a, b) => b.latestDate.getTime() - a.latestDate.getTime());

    // Most recent details
    const primaryName = list[0].name;
    const primaryAddress = list.find(x => x.address !== null)?.address || null;
    const primaryEmail = list.find(x => x.email !== null)?.email || null;

    let customer = await customerRepo.findOne({ where: { phone } });
    if (!customer) {
      customer = customerRepo.create({
        name: primaryName,
        phone,
        address: primaryAddress,
        email: primaryEmail,
      });
    } else {
      customer.name = primaryName;
      if (primaryAddress) customer.address = primaryAddress;
      if (primaryEmail) customer.email = primaryEmail;
    }

    customerMap[phone] = await customerRepo.save(customer);
  }
  console.log('✅  Customers upserted successfully.');

  // 3. Backfill customer_id on all service records
  console.log('🔗  Backfilling service record customer relationships...');

  let linkedAffidavits = 0;
  for (const a of affidavits) {
    const cleanPhone = a.phone.trim();
    if (customerMap[cleanPhone]) {
      a.customer = customerMap[cleanPhone];
      await affidavitRepo.save(a);
      linkedAffidavits++;
    }
  }

  let linkedMarriages = 0;
  for (const m of marriages) {
    const cleanPhone = m.phone.trim();
    if (customerMap[cleanPhone]) {
      m.customer = customerMap[cleanPhone];
      await marriageRepo.save(m);
      linkedMarriages++;
    }
  }

  let linkedBirthDeath = 0;
  for (const b of birthDeathCerts) {
    const cleanPhone = b.phone.trim();
    if (customerMap[cleanPhone]) {
      b.customer = customerMap[cleanPhone];
      await birthDeathRepo.save(b);
      linkedBirthDeath++;
    }
  }

  let linkedProperty = 0;
  for (const p of propertyCards) {
    const cleanPhone = p.phone.trim();
    if (customerMap[cleanPhone]) {
      p.customer = customerMap[cleanPhone];
      await propertyCardRepo.save(p);
      linkedProperty++;
    }
  }

  let linkedShop = 0;
  for (const s of shopActLicenses) {
    const cleanPhone = s.phone.trim();
    if (customerMap[cleanPhone]) {
      s.customer = customerMap[cleanPhone];
      await shopActRepo.save(s);
      linkedShop++;
    }
  }

  console.log(`✅  Successfully linked relationships:`);
  console.log(`    - Affidavits linked: ${linkedAffidavits}/${affidavits.length}`);
  console.log(`    - Marriages linked: ${linkedMarriages}/${marriages.length}`);
  console.log(`    - Birth/Death Certs linked: ${linkedBirthDeath}/${birthDeathCerts.length}`);
  console.log(`    - Property Cards linked: ${linkedProperty}/${propertyCards.length}`);
  console.log(`    - Shop Act Licenses linked: ${linkedShop}/${shopActLicenses.length}`);
  console.log('───────────────────────────────────────────────────────\n');

  await dataSource.destroy();
}

async function affidavitsApiList(repo: any) { return repo.find({ relations: ['customer'] }); }
async function marriagesApiList(repo: any) { return repo.find({ relations: ['customer'] }); }
async function birthDeathApiList(repo: any) { return repo.find({ relations: ['customer'] }); }
async function propertyCardsApiList(repo: any) { return repo.find({ relations: ['customer'] }); }
async function shopActApiList(repo: any) { return repo.find({ relations: ['customer'] }); }

migrate().catch((err) => {
  console.error('\n❌  Migration failed:', err.message || err);
  process.exit(1);
});
