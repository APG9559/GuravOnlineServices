import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricingSetting } from './pricing-setting.entity';
import { User } from '../users/user.entity';

// ── Default values — used when seeding or when a key is missing ──────────────
export const DEFAULT_PRICING: Omit<PricingSetting, 'updatedAt' | 'updatedBy'>[] = [
  { key: 'magistrate_fee', value: 350, label: 'Executive Magistrate fee', group: 'affidavit' },
  { key: 'notary_fee', value: 600, label: 'Notary Public fee', group: 'affidavit' },
  { key: 'stamp500_cost', value: 500, label: '₹500 Stamp paper cost', group: 'affidavit' },
  { key: 'plain_cost', value: 0, label: 'Plain paper cost', group: 'affidavit' },
  { key: 'online_form', value: 300, label: 'Online form filling', group: 'marriage' },
  { key: 'offline_form', value: 300, label: 'Offline form filling', group: 'marriage' },
  { key: 'true_copy', value: 100, label: 'Document true copy', group: 'marriage' },
  { key: 'birth_death_first_copy', value: 300, label: 'First copy fee', group: 'birth_death' },
  { key: 'birth_death_extra_copy', value: 50, label: 'Each extra copy fee', group: 'birth_death' },
];

export type PricingMap = Record<string, number>;

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    @InjectRepository(PricingSetting)
    private readonly repo: Repository<PricingSetting>,
  ) { }

  // Ensure all default keys exist in DB on startup
  async onModuleInit() {
    for (const def of DEFAULT_PRICING) {
      const exists = await this.repo.findOne({ where: { key: def.key } });
      if (!exists) {
        await this.repo.save(this.repo.create({ ...def, updatedBy: null }));
      }
    }
  }

  async getAll(): Promise<PricingSetting[]> {
    return this.repo.find({ order: { group: 'ASC', key: 'ASC' } });
  }

  // Returns a flat { key: value } map — used by calculator endpoints
  async getPricingMap(): Promise<PricingMap> {
    const rows = await this.repo.find();
    return rows.reduce((acc, r) => {
      acc[r.key] = Number(r.value);
      return acc;
    }, {} as PricingMap);
  }

  // Update one or many keys at once
  async updateMany(updates: Record<string, number>, user: User): Promise<PricingSetting[]> {
    const results: PricingSetting[] = [];
    for (const [key, value] of Object.entries(updates)) {
      const row = await this.repo.findOne({ where: { key } });
      if (!row) continue; // ignore unknown keys
      row.value = value;
      row.updatedBy = user;
      results.push(await this.repo.save(row));
    }
    return results;
  }

  // Reset all to defaults
  async resetDefaults(user: User): Promise<PricingSetting[]> {
    const updates = DEFAULT_PRICING.reduce((acc, d) => {
      acc[d.key] = d.value;
      return acc;
    }, {} as Record<string, number>);
    return this.updateMany(updates, user);
  }
}
