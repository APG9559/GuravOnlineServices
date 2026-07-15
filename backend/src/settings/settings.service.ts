import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricingSetting } from './pricing-setting.entity';
import { User } from '../users/user.entity';
import { Customer } from '../customers/customer.entity';
import { Affidavit } from '../affidavits/affidavit.entity';
import { Marriage } from '../marriages/marriage.entity';
import { BirthDeathCertificate } from '../birth-death-certificates/birth-death-certificate.entity';
import { PropertyCard } from '../property-cards/property-card.entity';
import { ShopActLicense } from '../shop-act-licenses/shop-act-license.entity';
import { PanCardRecord } from '../csc-services/pan-card.entity';
import { PassportRecord } from '../csc-services/passport.entity';
import { VoterCardRecord } from '../csc-services/voter-card.entity';
import { Gazette } from '../gazettes/gazette.entity';
import { WaterConnection } from '../water-supply/water-connection.entity';
import { WaterServiceRecord } from '../water-supply/water-service-record.entity';
import { Property } from '../property-tax/property.entity';
import { PropertyTaxRecord } from '../property-tax/property-tax-record.entity';
import { execSync } from 'child_process';
import { Response } from 'express';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// ── Default values ────────────────────────────────────────────────────────────
export const DEFAULT_PRICING: Omit<PricingSetting, 'updatedAt' | 'updatedBy'>[] = [
  { key: 'magistrate_fee', value: 350, label: 'Executive Magistrate fee', group: 'affidavit' },
  { key: 'notary_fee', value: 600, label: 'Notary Public fee', group: 'affidavit' },
  { key: 'stamp500_cost', value: 500, label: '₹500 Stamp paper cost', group: 'affidavit' },
  { key: 'plain_cost', value: 0, label: 'Plain paper cost', group: 'affidavit' },
  { key: 'online_form', value: 300, label: 'Online form filling', group: 'marriage' },
  { key: 'offline_form', value: 300, label: 'Offline form filling', group: 'marriage' },
  { key: 'true_copy', value: 100, label: 'Document true copy', group: 'marriage' },
  { key: 'marriage_consultancy_fee', value: 500, label: 'Marriage consultancy fee', group: 'marriage' },
  { key: 'marriage_official_fee_upto_3_months', value: 500, label: 'Official Fee (Upto 3 Months)', group: 'marriage' },
  { key: 'marriage_official_fee_3_to_12_months', value: 600, label: 'Official Fee (3 - 12 Months)', group: 'marriage' },
  { key: 'marriage_official_fee_after_12_months', value: 750, label: 'Official Fee (After 12 Months)', group: 'marriage' },
  { key: 'marriage_court_fee_tickets', value: 110, label: 'Court Fee Tickets', group: 'marriage' },
  { key: 'marriage_misc_fee', value: 0, label: 'Misc (Form - Xerox Copies)', group: 'marriage' },
  { key: 'marriage_affidavits_paid_separately', value: 1, label: 'Affidavits Paid Separately (1=Checked, 0=Unchecked)', group: 'marriage' },
  { key: 'birth_death_first_copy', value: 300, label: 'First copy fee', group: 'birth_death' },
  { key: 'birth_death_extra_copy', value: 50, label: 'Each extra copy fee', group: 'birth_death' },
  { key: 'property_card_fee', value: 100, label: 'Property Card fee', group: 'property_card' },
  { key: 'seven_twelve_fee', value: 100, label: '7/12 Card fee', group: 'property_card' },
  { key: 'eight_a_fee', value: 100, label: '8A Card fee', group: 'property_card' },
  { key: 'shop_act_license_fee', value: 500, label: 'Shop Act License fee', group: 'shop_act' },
  { key: 'trade_license_new_service_fee', value: 300, label: 'New Trade License Service Fee', group: 'trade_license' },
  { key: 'trade_license_renew_service_fee', value: 200, label: 'Renew Trade License Service Fee', group: 'trade_license' },
  { key: 'trade_license_transfer_heir_service_fee', value: 250, label: 'Transfer to Heir Service Fee', group: 'trade_license' },
  { key: 'trade_license_transfer_third_party_service_fee', value: 300, label: 'Transfer to Third Party Service Fee', group: 'trade_license' },
  { key: 'trade_license_name_change_service_fee', value: 150, label: 'Business Name Change Service Fee', group: 'trade_license' },
  { key: 'trade_license_trade_change_service_fee', value: 200, label: 'Business Trade Change Service Fee', group: 'trade_license' },
  { key: 'trade_license_partner_change_service_fee', value: 150, label: "Partner's Name Change Service Fee", group: 'trade_license' },
  { key: 'trade_license_cancel_service_fee', value: 100, label: 'Trade License Cancel Service Fee', group: 'trade_license' },
  { key: 'trade_license_link_affidavit_fee', value: 100, label: 'Add service: Link Affidavit fee', group: 'trade_license' },
  { key: 'trade_license_link_property_card_fee', value: 100, label: 'Add service: Link Property Card fee', group: 'trade_license' },
  { key: 'trade_license_link_shop_act_fee', value: 100, label: 'Add service: Link Shop Act fee', group: 'trade_license' },
  { key: 'trade_license_protocol_fee', value: 100, label: 'Protocol Fee', group: 'trade_license' },
  { key: 'csc_pan_card_new_fee', value: 200, label: 'PAN Card - New Application Service Fee', group: 'csc' },
  { key: 'csc_pan_card_correction_fee', value: 150, label: 'PAN Card - Correction Service Fee', group: 'csc' },
  { key: 'csc_pan_card_reprint_fee', value: 120, label: 'PAN Card - Reprint Service Fee', group: 'csc' },
  { key: 'csc_passport_fresh_fee', value: 400, label: 'Passport - Fresh Application Service Fee', group: 'csc' },
  { key: 'csc_passport_reissue_fee', value: 350, label: 'Passport - Re-issue Service Fee', group: 'csc' },
  { key: 'csc_voter_card_new_fee', value: 0, label: 'Voter Card - New Application Service Fee', group: 'aaple_sarkar' },
  { key: 'csc_voter_card_correction_fee', value: 0, label: 'Voter Card - Correction Service Fee', group: 'aaple_sarkar' },
  { key: 'csc_voter_card_name_deletion_fee', value: 0, label: 'Voter Card - Name Deletion Service Fee', group: 'aaple_sarkar' },
  { key: 'csc_voter_card_address_change_fee', value: 0, label: 'Voter Card - Address Change Service Fee', group: 'aaple_sarkar' },
  { key: 'gazette_official_fee', value: 500, label: 'Gazette Official Fee', group: 'aaple_sarkar' },
  { key: 'gazette_service_fee', value: 150, label: 'Gazette Service Fee', group: 'aaple_sarkar' },
  { key: 'water_supply_new_official_fee', value: 1000, label: 'Water Supply: New Connection Official Fee', group: 'water_supply' },
  { key: 'water_supply_new_service_fee', value: 500, label: 'Water Supply: New Connection Service Fee', group: 'water_supply' },
  { key: 'water_supply_transfer_official_fee', value: 500, label: 'Water Supply: Connection Transfer Official Fee', group: 'water_supply' },
  { key: 'water_supply_transfer_service_fee', value: 300, label: 'Water Supply: Connection Transfer Service Fee', group: 'water_supply' },
  { key: 'water_supply_disconnection_official_fee', value: 200, label: 'Water Supply: Meter Disconnection Official Fee', group: 'water_supply' },
  { key: 'water_supply_disconnection_service_fee', value: 150, label: 'Water Supply: Meter Disconnection Service Fee', group: 'water_supply' },
  { key: 'water_supply_reconnection_official_fee', value: 300, label: 'Water Supply: Meter Reconnection Official Fee', group: 'water_supply' },
  { key: 'water_supply_reconnection_service_fee', value: 200, label: 'Water Supply: Meter Reconnection Service Fee', group: 'water_supply' },
  { key: 'water_supply_nodues_official_fee', value: 150, label: 'Water Supply: No Dues Certificate Official Fee', group: 'water_supply' },
  { key: 'water_supply_nodues_service_fee', value: 100, label: 'Water Supply: No Dues Certificate Service Fee', group: 'water_supply' },
  { key: 'water_supply_inspection_official_fee', value: 200, label: 'Water Supply: Meter Inspection Official Fee', group: 'water_supply' },
  { key: 'water_supply_inspection_service_fee', value: 150, label: 'Water Supply: Meter Inspection Service Fee', group: 'water_supply' },
  { key: 'water_supply_change_official_fee', value: 400, label: 'Water Supply: Change of Use Official Fee', group: 'water_supply' },
  { key: 'water_supply_change_service_fee', value: 250, label: 'Water Supply: Change of Use Service Fee', group: 'water_supply' },
  { key: 'property_tax_assessment_official_fee', value: 200, label: 'Property Tax: Assessment Copy Official Fee', group: 'property_tax' },
  { key: 'property_tax_assessment_service_fee', value: 150, label: 'Property Tax: Assessment Copy Service Fee', group: 'property_tax' },
  { key: 'property_tax_assessment_protocol_fee', value: 50, label: 'Property Tax: Assessment Copy Protocol Fee', group: 'property_tax' },
  { key: 'property_tax_transfer_official_fee', value: 500, label: 'Property Tax: Name Transfer Official Fee', group: 'property_tax' },
  { key: 'property_tax_transfer_service_fee', value: 300, label: 'Property Tax: Name Transfer Service Fee', group: 'property_tax' },
  { key: 'property_tax_transfer_protocol_fee', value: 100, label: 'Property Tax: Name Transfer Protocol Fee', group: 'property_tax' },
  { key: 'property_tax_nodues_official_fee', value: 150, label: 'Property Tax: No Dues Certificate Official Fee', group: 'property_tax' },
  { key: 'property_tax_nodues_service_fee', value: 100, label: 'Property Tax: No Dues Certificate Service Fee', group: 'property_tax' },
  { key: 'property_tax_nodues_protocol_fee', value: 50, label: 'Property Tax: No Dues Certificate Protocol Fee', group: 'property_tax' },
];

export type PricingMap = Record<string, number>;

// ── PostgreSQL tool path resolver ────────────────────────────────────────────
// On Windows, pg_dump/pg_restore are often not on PATH even when PostgreSQL is
// installed. This probes the standard install directories for versions 12–17.
function findPgTool(tool: string): string {
  if (process.platform !== 'win32') return tool;
  const versions = ['17', '16', '15', '14', '13', '12'];
  const bases = [
    'C:\\Program Files\\PostgreSQL',
    'C:\\Program Files (x86)\\PostgreSQL',
  ];
  for (const base of bases) {
    for (const ver of versions) {
      const candidate = path.join(base, ver, 'bin', `${tool}.exe`);
      if (fs.existsSync(candidate)) {
        return `"${candidate}"`;
      }
    }
  }
  return tool; // fall back to PATH (works on Linux/Mac or if PATH is configured)
}

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(PricingSetting)
    private readonly repo: Repository<PricingSetting>,
  ) { }

  async onModuleInit() {
    for (const def of DEFAULT_PRICING) {
      const exists = await this.repo.findOne({ where: { key: def.key } });
      if (!exists) {
        await this.repo.save(this.repo.create({ ...def, updatedBy: null }));
      } else if (exists.group !== def.group) {
        exists.group = def.group;
        await this.repo.save(exists);
      }
    }
    // Auto-run customer backfill migration on startup
    this.backfillCustomers().catch(err => {
      this.logger.error(`Failed to auto-run backfillCustomers: ${err.message}`);
    });
  }

  async getAll(): Promise<PricingSetting[]> {
    return this.repo.find({ order: { group: 'ASC', key: 'ASC' } });
  }

  async getPricingMap(): Promise<PricingMap> {
    const rows = await this.repo.find();
    return rows.reduce((acc, r) => {
      acc[r.key] = Number(r.value);
      return acc;
    }, {} as PricingMap);
  }

  async updateMany(updates: Record<string, number>, user: User): Promise<PricingSetting[]> {
    const results: PricingSetting[] = [];
    for (const [key, value] of Object.entries(updates)) {
      const row = await this.repo.findOne({ where: { key } });
      if (!row) continue;
      row.value = value;
      row.updatedBy = user;
      results.push(await this.repo.save(row));
    }
    return results;
  }

  async resetDefaults(user: User): Promise<PricingSetting[]> {
    const updates = DEFAULT_PRICING.reduce((acc, d) => {
      acc[d.key] = d.value;
      return acc;
    }, {} as Record<string, number>);
    return this.updateMany(updates, user);
  }

  // ── Database Export ───────────────────────────────────────────────────────
  async exportDatabase(res: Response): Promise<void> {
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '5432';
    const dbName = process.env.DB_NAME || 'familystore';
    const dbUser = process.env.DB_USERNAME || 'postgres';
    const dbPass = process.env.DB_PASSWORD || '';

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `db_backup_${timestamp}.dump`;
    const tmpFile = path.join(os.tmpdir(), filename);

    try {
      const pgDump = findPgTool('pg_dump');
      const cmd = `${pgDump} --host=${dbHost} --port=${dbPort} --username=${dbUser} --dbname=${dbName} --no-owner --no-privileges --format=custom --file=${tmpFile}`;
      this.logger.log(`[DB Export] Running pg_dump to ${tmpFile}`);
      execSync(cmd, { env: { ...process.env, PGPASSWORD: dbPass }, timeout: 120_000 });

      const stat = fs.statSync(tmpFile);
      res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': stat.size.toString(),
      });

      const stream = fs.createReadStream(tmpFile);
      stream.pipe(res);
      stream.on('end', () => fs.unlinkSync(tmpFile));
      stream.on('error', () => {
        try { fs.unlinkSync(tmpFile); } catch {}
      });
    } catch (error) {
      try { fs.unlinkSync(tmpFile); } catch {}
      this.logger.error(`[DB Export] pg_dump failed: ${error.message}`);
      throw error;
    }
  }

  // ── Database Import ───────────────────────────────────────────────────────
  async importDatabase(
    fileBuffer: Buffer,
    mode: 'full' | 'insert',
  ): Promise<{ success: boolean; message: string }> {
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '5432';
    const dbName = process.env.DB_NAME || 'familystore';
    const dbUser = process.env.DB_USERNAME || 'postgres';
    const dbPass = process.env.DB_PASSWORD || '';

    const tmpFile = path.join(os.tmpdir(), `db_import_${Date.now()}.dump`);

    try {
      fs.writeFileSync(tmpFile, fileBuffer);

      const pgRestore = findPgTool('pg_restore');
      const cleanFlags = mode === 'full' ? '--clean --if-exists' : '';
      const cmd = `${pgRestore} --host=${dbHost} --port=${dbPort} --username=${dbUser} --dbname=${dbName} --no-owner --no-privileges ${cleanFlags} ${tmpFile}`;

      this.logger.log(`[DB Import] Running pg_restore (mode=${mode}) from ${tmpFile}`);
      execSync(cmd, { env: { ...process.env, PGPASSWORD: dbPass }, timeout: 300_000 });

      fs.unlinkSync(tmpFile);
      const modeLabel = mode === 'full' ? 'Full restore' : 'Insert-only import';
      return { success: true, message: `${modeLabel} completed successfully.` };
    } catch (error) {
      try { fs.unlinkSync(tmpFile); } catch {}

      const stderr = (error.stderr?.toString() || error.message || '').toLowerCase();
      const isToolMissing = stderr.includes('not recognized') || stderr.includes('not found') || stderr.includes('no such file');

      if (isToolMissing) {
        // pg_restore binary itself was not found — this is a real infrastructure error, not a warning
        const resolvedPath = findPgTool('pg_restore');
        this.logger.error(`[DB Import] pg_restore not found. Tried: ${resolvedPath}`);
        throw new Error(
          `pg_restore executable not found. Please install PostgreSQL client tools and ensure the bin directory is on your system PATH. Tried: ${resolvedPath}`,
        );
      }

      // pg_restore returns exit code 1 for non-fatal warnings (e.g. "relation already exists" in insert mode).
      if (error.status === 1 && mode === 'insert') {
        this.logger.warn(`[DB Import] pg_restore completed with warnings (insert mode): ${error.stderr?.toString()?.slice(0, 500)}`);
        return { success: true, message: 'Import completed with warnings. Some records may have been skipped because they already exist.' };
      }

      this.logger.error(`[DB Import] pg_restore failed: ${error.message}`);
      throw error;
    }
  }


  // ── Database Clear ─────────────────────────────────────────────────────────
  async clearDatabase(): Promise<{ success: boolean; message: string }> {
    this.logger.log(`[DB Clear] Starting full truncate of transactional tables`);
    try {
      const entities = this.repo.manager.connection.entityMetadatas;
      const excludeTables = ['users', 'passkeys', 'pricing_settings', 'trade_type_configs'];
      const tablesToTruncate = entities
        .map(entity => entity.tableName)
        .filter(tableName => !excludeTables.includes(tableName))
        .map(tableName => `"${tableName}"`);

      if (tablesToTruncate.length > 0) {
        const query = `TRUNCATE TABLE ${tablesToTruncate.join(', ')} RESTART IDENTITY CASCADE;`;
        this.logger.log(`[DB Clear] Executing query: ${query}`);
        await this.repo.manager.query(query);
      }
      this.logger.log(`[DB Clear] Successfully cleared all database records`);
      return { success: true, message: 'All database records cleared successfully.' };
    } catch (error) {
      this.logger.error(`[DB Clear] Failed to clear database: ${error.message}`);
      throw error;
    }
  }

  // ── Customer Backfill Migration ────────────────────────────────────────────
  async backfillCustomers(): Promise<{ success: boolean; stats: Record<string, number> }> {
    this.logger.log(`[Customer Backfill] Starting customer backfill migration`);
    const manager = this.repo.manager;
    const stats: Record<string, number> = {};

    const upsertCustomer = async (name: string, phone: string | null, address: string | null, email: string | null) => {
      if (!name) return null;
      let customer = null;
      if (phone) {
        customer = await manager.findOne(Customer, { where: { phone } });
      }
      if (!customer) {
        customer = await manager.createQueryBuilder(Customer, 'c')
          .where('LOWER(c.name) = LOWER(:name)', { name: name.trim() })
          .getOne();
      }
      if (customer) {
        customer.name = name;
        if (phone && !customer.phone) customer.phone = phone;
        if (address && !customer.address) customer.address = address;
        if (email && !customer.email) customer.email = email;
        return manager.save(customer);
      } else {
        const newCust = manager.create(Customer, {
          name,
          phone: phone || null,
          address: address || null,
          email: email || null,
        });
        return manager.save(newCust);
      }
    };

    try {
      // 1. BaseRecordService entities
      const baseEntities = [
        { entity: Affidavit, name: 'Affidavit', nameField: 'customerName', phoneField: 'phone' },
        { entity: Marriage, name: 'Marriage', nameField: 'contactName', phoneField: 'phone' },
        { entity: BirthDeathCertificate, name: 'BirthDeathCertificate', nameField: 'customerName', phoneField: 'phone' },
        { entity: PropertyCard, name: 'PropertyCard', nameField: 'customerName', phoneField: 'phone' },
        { entity: ShopActLicense, name: 'ShopActLicense', nameField: 'customerName', phoneField: 'phone' },
        { entity: PanCardRecord, name: 'PanCardRecord', nameField: 'customerName', phoneField: 'phone' },
        { entity: PassportRecord, name: 'PassportRecord', nameField: 'customerName', phoneField: 'phone' },
        { entity: VoterCardRecord, name: 'VoterCardRecord', nameField: 'customerName', phoneField: 'phone' },
        { entity: Gazette, name: 'Gazette', nameField: 'customerName', phoneField: 'phone' },
      ];

      for (const item of baseEntities) {
        const records = await manager.find<any>(item.entity, { relations: ['customer'] });
        let count = 0;
        for (const rec of records) {
          if (!rec.customer && rec[item.nameField]) {
            const customer = await upsertCustomer(
              rec[item.nameField],
              rec[item.phoneField] || null,
              rec.connectionAddress || rec.address || null,
              rec.email || rec.contactEmail || null,
            );
            if (customer) {
              rec.customer = customer;
              await manager.save(rec);
              count++;
            }
          }
        }
        stats[item.name] = count;
      }

      // 2. WaterConnection profiles
      const waterConnections = await manager.find(WaterConnection, { relations: ['customer'] });
      let waterCount = 0;
      for (const conn of waterConnections) {
        if (!conn.customer && conn.currentOwner) {
          const customer = await upsertCustomer(
            conn.currentOwner,
            conn.contactPersonPhone || null,
            conn.connectionAddress || null,
            null,
          );
          if (customer) {
            conn.customer = customer;
            await manager.save(conn);
            waterCount++;
          }
        }
      }
      stats['WaterConnection'] = waterCount;

      // 3. Property Tax properties
      const properties = await manager.find(Property, { relations: ['customer'] });
      let propCount = 0;
      for (const prop of properties) {
        if (!prop.customer) {
          const firstRecord = await manager.findOne(PropertyTaxRecord, {
            where: { property: { id: prop.id } },
          });
          const details = firstRecord?.details || {};
          const name = details.customerName || null;
          const phone = details.phone || null;
          if (name) {
            const customer = await upsertCustomer(
              name,
              phone || null,
              prop.address || null,
              null,
            );
            if (customer) {
              prop.customer = customer;
              await manager.save(prop);
              propCount++;
            }
          }
        }
      }
      stats['PropertyTaxProperty'] = propCount;

      this.logger.log(`[Customer Backfill] Completed migration successfully: ${JSON.stringify(stats)}`);
      return { success: true, stats };
    } catch (error) {
      this.logger.error(`[Customer Backfill] Migration failed: ${error.message}`);
      throw error;
    }
  }
}
