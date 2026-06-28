import 'reflect-metadata';
import * as path from 'path';

try {
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
} catch {
  // running in prod container — env vars supplied externally
}

import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import { Customer } from '../customers/customer.entity';
import { Business } from '../trade-licenses/business.entity';
import { TradeLicenseRecord } from '../trade-licenses/trade-license-record.entity';
import { TradeTypeConfig } from '../trade-licenses/trade-type-config.entity';
import { TradeLicensePayment } from '../trade-licenses/trade-license-payment.entity';
import { Affidavit } from '../affidavits/affidavit.entity';
import { PropertyCard } from '../property-cards/property-card.entity';
import { ShopActLicense } from '../shop-act-licenses/shop-act-license.entity';
import { Role } from '../common/enums';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'familystore',
  entities: [User, Customer, Business, TradeLicenseRecord, TradeTypeConfig, TradeLicensePayment, Affidavit, PropertyCard, ShopActLicense],
  synchronize: false,
});

async function seed() {
  console.log('\n🌱  Gurav Online Services — Demo Business Seeder');
  console.log('────────────────────────────────────────────');

  await dataSource.initialize();
  console.log('✅  Connected to PostgreSQL\n');

  const userRepo = dataSource.getRepository(User);
  const customerRepo = dataSource.getRepository(Customer);
  const businessRepo = dataSource.getRepository(Business);
  const recordRepo = dataSource.getRepository(TradeLicenseRecord);
  const configRepo = dataSource.getRepository(TradeTypeConfig);

  // 1. Get an admin user
  let admin = await userRepo.findOne({ where: { role: Role.ADMIN } });
  if (!admin) {
    console.log('⚠️  No Admin user found. Run the main seeder first or ensure an admin exists.');
    process.exit(1);
  }

  // 2. Setup Trade Type Config
  const tradeCategory = '59 MEDICINE';
  const tradeSubtype = '3 RETAIL AND WHOLESALE';
  let config = await configRepo.findOne({ where: { tradeType: tradeCategory, tradeSubtype } });
  if (!config) {
    config = configRepo.create({
      tradeType: tradeCategory,
      tradeSubtype,
      officialFee: 5750,
    });
    await configRepo.save(config);
    console.log('✅  Created Trade Config: 59 MEDICINE - 3 RETAIL AND WHOLESALE');
  }

  // 3. Demo Businesses details
  // We want them approved in the LAST financial year. 
  // e.g., if today is June 2026 (FY 26), last FY was FY 25 (April 2025 to March 2026).
  const datesLastFY = [
    new Date('2025-06-19T10:00:00Z'), // FY 2025
    new Date('2025-11-05T14:30:00Z'), // FY 2025
    new Date('2026-02-15T09:15:00Z'), // FY 2025
  ];

  const demoData = [
    {
      name: 'SHREEYASH HP GAS AGENCY',
      licenseNo: 'KMCTL-0102',
      customerName: 'BHAGWAN RAGHUNATH SURYAWANSHI',
      phone: '9552564759',
      email: 'bhagwansurywnshi@gmail.com',
      date: datesLastFY[0],
    },
    {
      name: 'APOLLO PHARMACY KOLHAPUR',
      licenseNo: 'KMCTL-0305',
      customerName: 'SANTOSH KUMAR',
      phone: '9876543210',
      email: 'santosh.apollo@gmail.com',
      date: datesLastFY[1],
    },
    {
      name: 'MEDPLUS RETAIL',
      licenseNo: 'KMCTL-0888',
      customerName: 'RAHUL DESAI',
      phone: '9988776655',
      email: 'rahul.medplus@gmail.com',
      date: datesLastFY[2],
    }
  ];

  for (const data of demoData) {
    // Check if business exists
    const existingBusiness = await businessRepo.findOne({ where: { name: data.name } });
    if (existingBusiness) {
      console.log(`ℹ️   Business ${data.name} already exists. Skipping.`);
      continue;
    }

    // Create Customer
    let customer = await customerRepo.findOne({ where: { phone: data.phone } });
    if (!customer) {
      customer = customerRepo.create({
        name: data.customerName,
        phone: data.phone,
        email: data.email,
      });
      customer = await customerRepo.save(customer);
    }

    // Determine FY for the lastRenewalYear (which is the date it got approved)
    const month = data.date.getMonth();
    const year = data.date.getFullYear();
    const financialYear = month >= 3 ? year : year - 1;

    // Create Business
    const business = businessRepo.create({
      name: data.name,
      tradeType: tradeCategory,
      tradeSubtype: tradeSubtype,
      email: data.email,
      phone: data.phone,
      status: 'Approved',
      licenseNo: data.licenseNo,
      lastRenewalYear: financialYear, // Approved in last FY!
      customers: [customer],
    });
    const savedBusiness = await businessRepo.save(business);

    // Create Trade License Record (New Trade License)
    const record = recordRepo.create({
      serviceType: 'New',
      dateOfService: data.date.toISOString().split('T')[0],
      amountCharged: 7650.00,
      officialFee: 5750.00,
      serviceFee: 1900.00,
      business: savedBusiness,
      createdBy: admin,
      details: {
        status: 'Approved',
        licenseNo: data.licenseNo,
        notes: 'Demo data seed',
      },
      createdAt: data.date, 
      updatedAt: data.date,
    });
    await recordRepo.save(record);

    console.log(`✅  Created Business: ${data.name} (Approved in FY ${financialYear})`);
  }

  console.log('────────────────────────────────────────────\n');
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('\n❌  Seed failed:', err.message || err);
  process.exit(1);
});
