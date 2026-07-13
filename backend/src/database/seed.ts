import 'reflect-metadata';
import * as path from 'path';

try {
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
} catch {
  // running in prod container — env vars supplied externally
}

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { Affidavit } from '../affidavits/affidavit.entity';
import { Marriage } from '../marriages/marriage.entity';
import { MarriageTicket } from '../marriages/marriage-ticket.entity';
import { MarriagePayment } from '../marriages/marriage-payment.entity';
import { BirthDeathCertificate } from '../birth-death-certificates/birth-death-certificate.entity';
import { PropertyCard } from '../property-cards/property-card.entity';
import { ShopActLicense } from '../shop-act-licenses/shop-act-license.entity';
import { PricingSetting } from '../settings/pricing-setting.entity';
import { DEFAULT_PRICING } from '../settings/settings.service';
import { Role } from '../common/enums';
import { Business } from '../trade-licenses/business.entity';
import { BusinessTrade } from '../trade-licenses/business-trade.entity';
import { TradeLicenseRecord } from '../trade-licenses/trade-license-record.entity';
import { TradeLicensePayment } from '../trade-licenses/trade-license-payment.entity';
import { TradeTypeConfig } from '../trade-licenses/trade-type-config.entity';
import { PanCardRecord } from '../csc-services/pan-card.entity';
import { PassportRecord } from '../csc-services/passport.entity';
import { Customer } from '../customers/customer.entity';
import { Gazette } from '../gazettes/gazette.entity';
import { WaterConnection } from '../water-supply/water-connection.entity';
import { WaterServiceRecord } from '../water-supply/water-service-record.entity';
import { WaterPayment } from '../water-supply/water-payment.entity';
import { WaterFeeConfig } from '../water-supply/water-fee-config.entity';
import { WaterDocument } from '../water-supply/water-document.entity';
import { Property } from '../property-tax/property.entity';
import { PropertyTaxRecord } from '../property-tax/property-tax-record.entity';
import { PropertyTaxPayment } from '../property-tax/property-tax-payment.entity';
import { PropertyTaxFeeConfig } from '../property-tax/property-tax-fee-config.entity';
import { VoterCardRecord } from '../csc-services/voter-card.entity';
import { Expense } from '../expenses/expense.entity';
import { ActivityLog } from '../activity-logs/activity-log.entity';
import { Passkey } from '../auth/passkey.entity';

const SEED_USERS = [
  { name: 'Admin', email: 'admin@gurav.org', password: 'Admin@1234', role: Role.ADMIN },
  { name: 'Operator', email: 'operator@gurav.org', password: 'Operator@1234', role: Role.OPERATOR },
  { name: 'Akash', email: 'apg111331@gmail.com', password: 'AkashG@9559', role: Role.ADMIN },
  { name: 'Ashish', email: 'guravashish10@gmail.com', password: 'AshishG@9559', role: Role.OPERATOR },
  { name: 'Parshuram', email: 'guravparshuram10@gmail.com', password: 'ParshuramG@9559', role: Role.OPERATOR },
  { name: 'Vaishali', email: 'guravvaishali10@gmail.com', password: 'VaishaliG@9559', role: Role.OPERATOR },
  { name: 'Gauri', email: 'gauriwadekar21@gmail.com', password: 'GauriG@9559', role: Role.OPERATOR },
];

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'familystore',
  entities: [
    User, Passkey, Affidavit, Marriage, MarriageTicket, MarriagePayment,
    BirthDeathCertificate, PropertyCard, ShopActLicense,
    PricingSetting, Business, BusinessTrade, TradeLicenseRecord, TradeLicensePayment,
    TradeTypeConfig, PanCardRecord, PassportRecord,
    Customer, Gazette, WaterConnection, WaterServiceRecord, WaterPayment, WaterFeeConfig, WaterDocument,
    Property, PropertyTaxRecord, PropertyTaxPayment, PropertyTaxFeeConfig, VoterCardRecord, Expense, ActivityLog
  ],
  synchronize: true,
  ssl: process.env.DB_HOST?.includes('neon.tech') || process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false,
});

async function seed() {
  console.log('\n🌱  Gurav Online Services — Database Seeder');
  console.log('────────────────────────────────────────────');

  await dataSource.initialize();
  console.log('✅  Connected to PostgreSQL\n');

  // ── Users ──────────────────────────────────────────────────────────────────
  const userRepo = dataSource.getRepository(User);
  for (const seedUser of SEED_USERS) {
    const existing = await userRepo.findOne({ where: { email: seedUser.email } });
    if (existing) { console.log(`ℹ️   [${seedUser.role}] ${seedUser.email} already exists — skipping.`); continue; }
    const passwordHash = await bcrypt.hash(seedUser.password, 10);
    await userRepo.save(userRepo.create({ name: seedUser.name, email: seedUser.email, passwordHash, role: seedUser.role, isActive: true }));
    console.log(`✅  Created [${seedUser.role}]: ${seedUser.email}`);
  }

  // ── Pricing ────────────────────────────────────────────────────────────────
  console.log('\n📦  Seeding default pricing...');
  const pricingRepo = dataSource.getRepository(PricingSetting);
  for (const def of DEFAULT_PRICING) {
    const exists = await pricingRepo.findOne({ where: { key: def.key } });
    if (exists) { console.log(`ℹ️   Pricing key "${def.key}" already exists — skipping.`); continue; }
    await pricingRepo.save(pricingRepo.create({ ...def, updatedBy: null }));
    console.log(`✅  Pricing seeded: ${def.label} = ₹${def.value}`);
  }

  // ── Water Fee Configs ──────────────────────────────────────────────────────
  console.log('\n📦  Seeding default Water Supply fee configurations...');
  const feeConfigRepo = dataSource.getRepository(WaterFeeConfig);
  const DEFAULT_WATER_FEES = [
    { serviceType: 'NewConnection', officialFee: 1000, serviceFee: 500, protocolFee: 0, defaultMiscFee: 0, allowManualOverride: true },
    { serviceType: 'ConnectionTransfer', officialFee: 500, serviceFee: 300, protocolFee: 0, defaultMiscFee: 0, allowManualOverride: true },
    { serviceType: 'MeterDisconnection', officialFee: 300, serviceFee: 150, protocolFee: 0, defaultMiscFee: 0, allowManualOverride: true },
    { serviceType: 'MeterReconnection', officialFee: 400, serviceFee: 200, protocolFee: 0, defaultMiscFee: 0, allowManualOverride: true },
    { serviceType: 'ChangeOfUse', officialFee: 600, serviceFee: 300, protocolFee: 0, defaultMiscFee: 0, allowManualOverride: true },
    { serviceType: 'MeterInspection', officialFee: 200, serviceFee: 100, protocolFee: 0, defaultMiscFee: 0, allowManualOverride: true },
    { serviceType: 'NoDuesCertificate', officialFee: 150, serviceFee: 100, protocolFee: 0, defaultMiscFee: 0, allowManualOverride: true },
  ];

  for (const fee of DEFAULT_WATER_FEES) {
    const exists = await feeConfigRepo.findOne({ where: { serviceType: fee.serviceType } });
    if (exists) { console.log(`ℹ️   Water fee config for "${fee.serviceType}" already exists — skipping.`); continue; }
    await feeConfigRepo.save(feeConfigRepo.create({ ...fee, effectiveDate: new Date().toISOString().split('T')[0] }));
    console.log(`✅  Water fee config seeded: ${fee.serviceType} (Official: ₹${fee.officialFee}, Service: ₹${fee.serviceFee})`);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n────────────────────────────────────────────');
  console.log('📋  Login credentials:\n');
  for (const u of SEED_USERS) {
    console.log(`  Role:     ${u.role.toUpperCase()}`);
    console.log(`  Email:    ${u.email}`);
    console.log(`  Password: ${u.password}\n`);
  }
  console.log('📋  Default pricing rates:');
  for (const p of DEFAULT_PRICING) {
    console.log(`  ${p.label.padEnd(35)} ₹${p.value}`);
  }
  console.log('\n⚠️   Change passwords after first login via the Users page.');
  console.log('⚠️   Change rates anytime via the Settings page.');
  console.log('────────────────────────────────────────────\n');

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('\n❌  Seed failed:', err.message || err);
  process.exit(1);
});
