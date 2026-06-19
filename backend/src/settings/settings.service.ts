import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricingSetting } from './pricing-setting.entity';
import { User } from '../users/user.entity';

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
  {key: 'trade_license_link_affidavit_fee', value: 100, label: 'Add service: Link Affidavit fee', group: 'trade_license' },
  { key: 'trade_license_link_property_card_fee', value: 100, label: 'Add service: Link Property Card fee', group: 'trade_license' },
  { key: 'trade_license_link_shop_act_fee', value: 100, label: 'Add service: Link Shop Act fee', group: 'trade_license' },
  { key: 'trade_license_protocol_fee', value: 100, label: 'Protocol Fee', group: 'trade_license' },
  { key: 'csc_pan_card_new_fee', value: 200, label: 'PAN Card - New Application Service Fee', group: 'csc' },
  { key: 'csc_pan_card_correction_fee', value: 150, label: 'PAN Card - Correction Service Fee', group: 'csc' },
  { key: 'csc_pan_card_reprint_fee', value: 120, label: 'PAN Card - Reprint Service Fee', group: 'csc' },
  { key: 'csc_passport_fresh_fee', value: 400, label: 'Passport - Fresh Application Service Fee', group: 'csc' },
  { key: 'csc_passport_reissue_fee', value: 350, label: 'Passport - Re-issue Service Fee', group: 'csc' },
];

export type PricingMap = Record<string, number>;

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    @InjectRepository(PricingSetting)
    private readonly repo: Repository<PricingSetting>,
  ) { }

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
}
