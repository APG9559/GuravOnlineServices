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

async function migrate() {
  console.log('\n🏃  Gurav Online Services — Trade Licenses Financial Year Migration');
  console.log('───────────────────────────────────────────────────────');

  await dataSource.initialize();
  console.log('✅  Connected to PostgreSQL');

  const businessRepo = dataSource.getRepository(Business);
  const recordRepo = dataSource.getRepository(TradeLicenseRecord);

  console.log('📥  Fetching businesses...');
  const businesses = await businessRepo.find();
  console.log(`    - Found ${businesses.length} businesses.`);

  let updatedCount = 0;

  for (const business of businesses) {
    if (!business.lastRenewalYear) {
      continue; // Skip if no renewal year set yet
    }

    // Find the latest New or Renew record
    const latestRecord = await recordRepo.createQueryBuilder('r')
      .where('r.businessId = :businessId', { businessId: business.id })
      .andWhere('r.serviceType IN (:...types)', { types: ['New', 'Renew'] })
      .orderBy('r.dateOfService', 'DESC')
      .addOrderBy('r.createdAt', 'DESC')
      .getOne();

    let referenceDate = business.createdAt;
    if (latestRecord) {
      referenceDate = latestRecord.dateOfService ? new Date(latestRecord.dateOfService) : new Date(latestRecord.createdAt);
    }

    const month = referenceDate.getMonth(); // 0 = Jan
    const year = referenceDate.getFullYear();
    const financialYear = month >= 3 ? year : year - 1;

    if (business.lastRenewalYear !== financialYear) {
      console.log(`    🔄  Updating Business: ${business.name} (ID: ${business.id})`);
      console.log(`        - Old lastRenewalYear: ${business.lastRenewalYear}`);
      console.log(`        - New lastRenewalYear (FY): ${financialYear} (based on date: ${referenceDate.toISOString().split('T')[0]})`);
      
      business.lastRenewalYear = financialYear;
      await businessRepo.save(business);
      updatedCount++;
    }
  }

  console.log('───────────────────────────────────────────────────────');
  console.log(`✅  Migration complete. Updated ${updatedCount} businesses.`);

  await dataSource.destroy();
}

migrate().catch((err) => {
  console.error('\n❌  Migration failed:', err.message || err);
  process.exit(1);
});
