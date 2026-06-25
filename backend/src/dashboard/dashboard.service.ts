import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Affidavit } from '../affidavits/affidavit.entity';
import { Marriage } from '../marriages/marriage.entity';
import { BirthDeathCertificate } from '../birth-death-certificates/birth-death-certificate.entity';
import { PropertyCard } from '../property-cards/property-card.entity';
import { ShopActLicense } from '../shop-act-licenses/shop-act-license.entity';
import { PricingSetting } from '../settings/pricing-setting.entity';
import { TradeLicenseRecord } from '../trade-licenses/trade-license-record.entity';
import { PanCardRecord } from '../csc-services/pan-card.entity';
import { PassportRecord } from '../csc-services/passport.entity';
import { Gazette } from '../gazettes/gazette.entity';
import { WaterSupply } from '../water-supply/water-supply.entity';
import { PropertyTax } from '../property-tax/property-tax.entity';
import { VoterCardRecord } from '../csc-services/voter-card.entity';
import { Expense } from '../expenses/expense.entity';

@Injectable()
export class DashboardService {
  private cache = new Map<string, { timestamp: number; data: any }>();
  private readonly CACHE_TTL_MS = 15000; // 15 seconds cache

  constructor(
    @InjectRepository(Affidavit) private readonly affRepo: Repository<Affidavit>,
    @InjectRepository(Marriage) private readonly marRepo: Repository<Marriage>,
    @InjectRepository(BirthDeathCertificate) private readonly bdRepo: Repository<BirthDeathCertificate>,
    @InjectRepository(PropertyCard) private readonly pcRepo: Repository<PropertyCard>,
    @InjectRepository(ShopActLicense) private readonly salRepo: Repository<ShopActLicense>,
    @InjectRepository(PricingSetting) private readonly pricingRepo: Repository<PricingSetting>,
    @InjectRepository(TradeLicenseRecord) private readonly tlRepo: Repository<TradeLicenseRecord>,
    @InjectRepository(PanCardRecord) private readonly panRepo: Repository<PanCardRecord>,
    @InjectRepository(PassportRecord) private readonly passportRepo: Repository<PassportRecord>,
    @InjectRepository(Gazette) private readonly gazetteRepo: Repository<Gazette>,
    @InjectRepository(WaterSupply) private readonly wsRepo: Repository<WaterSupply>,
    @InjectRepository(PropertyTax) private readonly ptRepo: Repository<PropertyTax>,
    @InjectRepository(VoterCardRecord) private readonly voterRepo: Repository<VoterCardRecord>,
    @InjectRepository(Expense) private readonly expenseRepo: Repository<Expense>,
  ) { }

  async getSummary(from?: string, to?: string) {
    const todayObj = new Date();
    const startYear = todayObj.getFullYear();
    const startMonth = String(todayObj.getMonth() + 1).padStart(2, '0');
    const defaultFrom = `${startYear}-${startMonth}-01`;
    const lastDay = new Date(startYear, todayObj.getMonth() + 1, 0).getDate();
    const defaultTo = `${startYear}-${startMonth}-${String(lastDay).padStart(2, '0')}`;

    const actualFrom = from || defaultFrom;
    const actualTo = to || defaultTo;

    const cacheKey = `${actualFrom}_${actualTo}`;
    const cached = this.cache.get(cacheKey);
    const now = Date.now();
    if (cached && (now - cached.timestamp < this.CACHE_TTL_MS)) {
      return cached.data;
    }

    console.time(`Dashboard Query Execution [${actualFrom} to ${actualTo}]`);

    const pricingList = await this.pricingRepo.find();
    const pricing = pricingList.reduce((acc, r) => {
      acc[r.key] = Number(r.value);
      return acc;
    }, {} as Record<string, number>);

    const stampCost = pricing['stamp500_cost'] ?? 500;
    const plainCost = pricing['plain_cost'] ?? 0;

    const [
      affStats,
      affAuthRaw,
      affPaperRaw,
      affDailyRaw,
      affUserRaw,

      marStats,
      marActRaw,
      marDailyRaw,
      marUserRaw,

      bdStats,
      bdTypeRaw,
      bdDailyRaw,
      bdUserRaw,

      pcStats,
      pcTypeRaw,
      pcDailyRaw,
      pcUserRaw,

      salStats,
      salDailyRaw,
      salUserRaw,

      tlStats,
      tlDailyRaw,
      tlUserRaw,

      panStats,
      panDailyRaw,
      panUserRaw,

      passportStats,
      passportDailyRaw,
      passportUserRaw,

      voterStats,
      voterDailyRaw,
      voterUserRaw,

      gazetteStats,
      gazetteDailyRaw,
      gazetteUserRaw,

      wsStats,
      wsDailyRaw,
      wsUserRaw,

      ptStats,
      ptDailyRaw,
      ptUserRaw,

      expenseStats,
      expenseDailyRaw,
      expenseUserRaw,
    ] = await Promise.all([
      // Affidavits
      this.affRepo.createQueryBuilder('a')
        .select('COUNT(a.id)', 'count')
        .addSelect('SUM(a.amountCharged)', 'gross')
        .addSelect(
          `SUM(a.amountCharged - (CASE WHEN a.customerBroughtStamp THEN 0 WHEN a.paperType = 'stamp500' THEN :stampCost ELSE :plainCost END) - (CASE WHEN a.authorizerType = 'magistrate' THEN 30 ELSE COALESCE(a.notaryPublicFee, 0) END))`,
          'net'
        )
        .where('a.dateOfService >= :from AND a.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .setParameters({ stampCost, plainCost })
        .getRawOne(),
      this.affRepo.createQueryBuilder('a')
        .select('a.authorizerType', 'authorizerType')
        .addSelect('COUNT(a.id)', 'count')
        .where('a.dateOfService >= :from AND a.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .groupBy('a.authorizerType')
        .getRawMany(),
      this.affRepo.createQueryBuilder('a')
        .select('a.paperType', 'paperType')
        .addSelect('COUNT(a.id)', 'count')
        .where('a.dateOfService >= :from AND a.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .groupBy('a.paperType')
        .getRawMany(),
      this.affRepo.createQueryBuilder('a')
        .select('a.dateOfService', 'date')
        .addSelect(
          `SUM(a.amountCharged - (CASE WHEN a.customerBroughtStamp THEN 0 WHEN a.paperType = 'stamp500' THEN :stampCost ELSE :plainCost END) - (CASE WHEN a.authorizerType = 'magistrate' THEN 30 ELSE COALESCE(a.notaryPublicFee, 0) END))`,
          'net'
        )
        .where('a.dateOfService >= :from AND a.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .groupBy('a.dateOfService')
        .setParameters({ stampCost, plainCost })
        .getRawMany(),
      this.affRepo.createQueryBuilder('a')
        .innerJoin('a.createdBy', 'u')
        .select('u.id', 'userId')
        .addSelect('u.name', 'userName')
        .addSelect('SUM(a.amountCharged)', 'gross')
        .addSelect(
          `SUM(a.amountCharged - (CASE WHEN a.customerBroughtStamp THEN 0 WHEN a.paperType = 'stamp500' THEN :stampCost ELSE :plainCost END) - (CASE WHEN a.authorizerType = 'magistrate' THEN 30 ELSE COALESCE(a.notaryPublicFee, 0) END))`,
          'net'
        )
        .where('a.dateOfService >= :from AND a.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .groupBy('u.id')
        .addGroupBy('u.name')
        .setParameters({ stampCost, plainCost })
        .getRawMany(),

      // Marriages
      this.marRepo.createQueryBuilder('m')
        .select('COUNT(m.id)', 'count')
        .addSelect(
          `SUM(m."amountCharged" - COALESCE((
            SELECT SUM(aff."amountCharged")
            FROM marriage_affidavits ma
            INNER JOIN affidavits aff ON aff.id = ma."affidavitsId"
            WHERE ma."marriagesId" = m.id
          ), 0))`,
          'gross'
        )
        .addSelect(
          `SUM(m."amountCharged" - COALESCE((
            SELECT SUM(aff."amountCharged")
            FROM marriage_affidavits ma
            INNER JOIN affidavits aff ON aff.id = ma."affidavitsId"
            WHERE ma."marriagesId" = m.id
          ), 0) - COALESCE(m."officialFee", 0) - COALESCE(m."courtFeeTickets", 0))`,
          'net'
        )
        .where('m."dateOfService" >= :from AND m."dateOfService" <= :to', { from: actualFrom, to: actualTo })
        .getRawOne(),
      this.marRepo.createQueryBuilder('m')
        .select('m.marriageAct', 'marriageAct')
        .addSelect('COUNT(m.id)', 'count')
        .where('m.dateOfService >= :from AND m.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .groupBy('m.marriageAct')
        .getRawMany(),
      this.marRepo.createQueryBuilder('m')
        .select('m.dateOfService', 'date')
        .addSelect(
          `SUM(m."amountCharged" - COALESCE((
            SELECT SUM(aff."amountCharged")
            FROM marriage_affidavits ma
            INNER JOIN affidavits aff ON aff.id = ma."affidavitsId"
            WHERE ma."marriagesId" = m.id
          ), 0) - COALESCE(m."officialFee", 0) - COALESCE(m."courtFeeTickets", 0))`,
          'net'
        )
        .where('m."dateOfService" >= :from AND m."dateOfService" <= :to', { from: actualFrom, to: actualTo })
        .groupBy('m."dateOfService"')
        .getRawMany(),
      this.marRepo.createQueryBuilder('m')
        .innerJoin('m.createdBy', 'u')
        .select('u.id', 'userId')
        .addSelect('u.name', 'userName')
        .addSelect(
          `SUM(m."amountCharged" - COALESCE((
            SELECT SUM(aff."amountCharged")
            FROM marriage_affidavits ma
            INNER JOIN affidavits aff ON aff.id = ma."affidavitsId"
            WHERE ma."marriagesId" = m.id
          ), 0))`,
          'gross'
        )
        .addSelect(
          `SUM(m."amountCharged" - COALESCE((
            SELECT SUM(aff."amountCharged")
            FROM marriage_affidavits ma
            INNER JOIN affidavits aff ON aff.id = ma."affidavitsId"
            WHERE ma."marriagesId" = m.id
          ), 0) - COALESCE(m."officialFee", 0) - COALESCE(m."courtFeeTickets", 0))`,
          'net'
        )
        .where('m."dateOfService" >= :from AND m."dateOfService" <= :to', { from: actualFrom, to: actualTo })
        .groupBy('u.id')
        .addGroupBy('u.name')
        .getRawMany(),

      // Birth/Death
      this.bdRepo.createQueryBuilder('b')
        .select('COUNT(b.id)', 'count')
        .addSelect('SUM(b.amountCharged)', 'gross')
        .where('b.dateOfService >= :from AND b.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .getRawOne(),
      this.bdRepo.createQueryBuilder('b')
        .select('b.certificateType', 'certificateType')
        .addSelect('COUNT(b.id)', 'count')
        .where('b.dateOfService >= :from AND b.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .groupBy('b.certificateType')
        .getRawMany(),
      this.bdRepo.createQueryBuilder('b')
        .select('b.dateOfService', 'date')
        .addSelect('SUM(b.amountCharged)', 'net')
        .where('b.dateOfService >= :from AND b.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .groupBy('b.dateOfService')
        .getRawMany(),
      this.bdRepo.createQueryBuilder('b')
        .innerJoin('b.createdBy', 'u')
        .select('u.id', 'userId')
        .addSelect('u.name', 'userName')
        .addSelect('SUM(b.amountCharged)', 'gross')
        .addSelect('SUM(b.amountCharged)', 'net')
        .where('b.dateOfService >= :from AND b.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .groupBy('u.id')
        .addGroupBy('u.name')
        .getRawMany(),

      // Property Cards
      this.pcRepo.createQueryBuilder('p')
        .select('COUNT(p.id)', 'count')
        .addSelect('SUM(p.amountCharged)', 'gross')
        .where('p.dateOfService >= :from AND p.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .getRawOne(),
      this.pcRepo.createQueryBuilder('p')
        .select('p.recordType', 'recordType')
        .addSelect('COUNT(p.id)', 'count')
        .where('p.dateOfService >= :from AND p.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .groupBy('p.recordType')
        .getRawMany(),
      this.pcRepo.createQueryBuilder('p')
        .select('p.dateOfService', 'date')
        .addSelect('SUM(p.amountCharged)', 'net')
        .where('p.dateOfService >= :from AND p.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .groupBy('p.dateOfService')
        .getRawMany(),
      this.pcRepo.createQueryBuilder('p')
        .innerJoin('p.createdBy', 'u')
        .select('u.id', 'userId')
        .addSelect('u.name', 'userName')
        .addSelect('SUM(p.amountCharged)', 'gross')
        .addSelect('SUM(p.amountCharged)', 'net')
        .where('p.dateOfService >= :from AND p.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .groupBy('u.id')
        .addGroupBy('u.name')
        .getRawMany(),

      // Shop Act
      this.salRepo.createQueryBuilder('s')
        .select('COUNT(s.id)', 'count')
        .addSelect('SUM(s.amountCharged)', 'gross')
        .where('s.dateOfService >= :from AND s.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .getRawOne(),
      this.salRepo.createQueryBuilder('s')
        .select('s.dateOfService', 'date')
        .addSelect('SUM(s.amountCharged)', 'net')
        .where('s.dateOfService >= :from AND s.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .groupBy('s.dateOfService')
        .getRawMany(),
      this.salRepo.createQueryBuilder('s')
        .innerJoin('s.createdBy', 'u')
        .select('u.id', 'userId')
        .addSelect('u.name', 'userName')
        .addSelect('SUM(s.amountCharged)', 'gross')
        .addSelect('SUM(s.amountCharged)', 'net')
        .where('s.dateOfService >= :from AND s.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .groupBy('u.id')
        .addGroupBy('u.name')
        .getRawMany(),

      // Trade Licenses
      this.tlRepo.createQueryBuilder('t')
        .select('COUNT(t.id)', 'count')
        .addSelect(
          `SUM(t."amountCharged" - COALESCE((SELECT la."amountCharged" FROM affidavits la WHERE la.id = t.linked_affidavit_id), 0) - COALESCE((SELECT lpc."amountCharged" FROM property_cards lpc WHERE lpc.id = t.linked_property_card_id), 0) - COALESCE((SELECT lsa."amountCharged" FROM shop_act_licenses lsa WHERE lsa.id = t.linked_shop_act_id), 0))`,
          'gross'
        )
        .addSelect(
          `SUM(t."amountCharged" - COALESCE((SELECT la."amountCharged" FROM affidavits la WHERE la.id = t.linked_affidavit_id), 0) - COALESCE((SELECT lpc."amountCharged" FROM property_cards lpc WHERE lpc.id = t.linked_property_card_id), 0) - COALESCE((SELECT lsa."amountCharged" FROM shop_act_licenses lsa WHERE lsa.id = t.linked_shop_act_id), 0) - COALESCE(t."officialFee", 0) - COALESCE(t."protocolFee", 0))`,
          'net'
        )
        .where('t."dateOfService" >= :from AND t."dateOfService" <= :to', { from: actualFrom, to: actualTo })
        .getRawOne(),
      this.tlRepo.createQueryBuilder('t')
        .select('t.dateOfService', 'date')
        .addSelect(
          `SUM(t."amountCharged" - COALESCE((SELECT la."amountCharged" FROM affidavits la WHERE la.id = t.linked_affidavit_id), 0) - COALESCE((SELECT lpc."amountCharged" FROM property_cards lpc WHERE lpc.id = t.linked_property_card_id), 0) - COALESCE((SELECT lsa."amountCharged" FROM shop_act_licenses lsa WHERE lsa.id = t.linked_shop_act_id), 0) - COALESCE(t."officialFee", 0) - COALESCE(t."protocolFee", 0))`,
          'net'
        )
        .where('t."dateOfService" >= :from AND t."dateOfService" <= :to', { from: actualFrom, to: actualTo })
        .groupBy('t."dateOfService"')
        .getRawMany(),
      this.tlRepo.createQueryBuilder('t')
        .innerJoin('t.createdBy', 'u')
        .select('u.id', 'userId')
        .addSelect('u.name', 'userName')
        .addSelect(
          `SUM(t."amountCharged" - COALESCE((SELECT la."amountCharged" FROM affidavits la WHERE la.id = t.linked_affidavit_id), 0) - COALESCE((SELECT lpc."amountCharged" FROM property_cards lpc WHERE lpc.id = t.linked_property_card_id), 0) - COALESCE((SELECT lsa."amountCharged" FROM shop_act_licenses lsa WHERE lsa.id = t.linked_shop_act_id), 0))`,
          'gross'
        )
        .addSelect(
          `SUM(t."amountCharged" - COALESCE((SELECT la."amountCharged" FROM affidavits la WHERE la.id = t.linked_affidavit_id), 0) - COALESCE((SELECT lpc."amountCharged" FROM property_cards lpc WHERE lpc.id = t.linked_property_card_id), 0) - COALESCE((SELECT lsa."amountCharged" FROM shop_act_licenses lsa WHERE lsa.id = t.linked_shop_act_id), 0) - COALESCE(t."officialFee", 0) - COALESCE(t."protocolFee", 0))`,
          'net'
        )
        .where('t."dateOfService" >= :from AND t."dateOfService" <= :to', { from: actualFrom, to: actualTo })
        .groupBy('u.id')
        .addGroupBy('u.name')
        .getRawMany(),

      // PAN Cards
      this.panRepo.createQueryBuilder('pan')
        .select('COUNT(pan.id)', 'count')
        .addSelect('SUM(pan.amountCharged)', 'gross')
        .addSelect('SUM(pan.amountCharged - COALESCE(pan.officialFee, 0))', 'net')
        .where('pan.dateOfService >= :from AND pan.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .getRawOne(),
      this.panRepo.createQueryBuilder('pan')
        .select('pan.dateOfService', 'date')
        .addSelect('SUM(pan.amountCharged - COALESCE(pan.officialFee, 0))', 'net')
        .where('pan.dateOfService >= :from AND pan.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .groupBy('pan.dateOfService')
        .getRawMany(),
      this.panRepo.createQueryBuilder('pan')
        .innerJoin('pan.createdBy', 'u')
        .select('u.id', 'userId')
        .addSelect('u.name', 'userName')
        .addSelect('SUM(pan.amountCharged)', 'gross')
        .addSelect('SUM(pan.amountCharged - COALESCE(pan.officialFee, 0))', 'net')
        .where('pan.dateOfService >= :from AND pan.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .groupBy('u.id')
        .addGroupBy('u.name')
        .getRawMany(),

      // Passports
      this.passportRepo.createQueryBuilder('pass')
        .select('COUNT(pass.id)', 'count')
        .addSelect('SUM(pass.amountCharged)', 'gross')
        .addSelect('SUM(pass.amountCharged - COALESCE(pass.officialFee, 0))', 'net')
        .where('pass.dateOfService >= :from AND pass.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .getRawOne(),
      this.passportRepo.createQueryBuilder('pass')
        .select('pass.dateOfService', 'date')
        .addSelect('SUM(pass.amountCharged - COALESCE(pass.officialFee, 0))', 'net')
        .where('pass.dateOfService >= :from AND pass.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .groupBy('pass.dateOfService')
        .getRawMany(),
      this.passportRepo.createQueryBuilder('pass')
        .innerJoin('pass.createdBy', 'u')
        .select('u.id', 'userId')
        .addSelect('u.name', 'userName')
        .addSelect('SUM(pass.amountCharged)', 'gross')
        .addSelect('SUM(pass.amountCharged - COALESCE(pass.officialFee, 0))', 'net')
        .where('pass.dateOfService >= :from AND pass.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .groupBy('u.id')
        .addGroupBy('u.name')
        .getRawMany(),

      // Voter Cards
      this.voterRepo.createQueryBuilder('v')
        .select('COUNT(v.id)', 'count')
        .addSelect('SUM(v.amountCharged)', 'gross')
        .addSelect('SUM(v.amountCharged - COALESCE(v.officialFee, 0))', 'net')
        .where('v.dateOfService >= :from AND v.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .getRawOne(),
      this.voterRepo.createQueryBuilder('v')
        .select('v.dateOfService', 'date')
        .addSelect('SUM(v.amountCharged - COALESCE(v.officialFee, 0))', 'net')
        .where('v.dateOfService >= :from AND v.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .groupBy('v.dateOfService')
        .getRawMany(),
      this.voterRepo.createQueryBuilder('v')
        .innerJoin('v.createdBy', 'u')
        .select('u.id', 'userId')
        .addSelect('u.name', 'userName')
        .addSelect('SUM(v.amountCharged)', 'gross')
        .addSelect('SUM(v.amountCharged - COALESCE(v.officialFee, 0))', 'net')
        .where('v.dateOfService >= :from AND v.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .groupBy('u.id')
        .addGroupBy('u.name')
        .getRawMany(),

      // Gazettes
      this.gazetteRepo.createQueryBuilder('g')
        .select('COUNT(g.id)', 'count')
        .addSelect('SUM(g.amountCharged)', 'gross')
        .addSelect('SUM(g.amountCharged - COALESCE(g.officialFee, 0))', 'net')
        .where('g.dateOfService >= :from AND g.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .getRawOne(),
      this.gazetteRepo.createQueryBuilder('g')
        .select('g.dateOfService', 'date')
        .addSelect('SUM(g.amountCharged - COALESCE(g.officialFee, 0))', 'net')
        .where('g.dateOfService >= :from AND g.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .groupBy('g.dateOfService')
        .getRawMany(),
      this.gazetteRepo.createQueryBuilder('g')
        .innerJoin('g.createdBy', 'u')
        .select('u.id', 'userId')
        .addSelect('u.name', 'userName')
        .addSelect('SUM(g.amountCharged)', 'gross')
        .addSelect('SUM(g.amountCharged - COALESCE(g.officialFee, 0))', 'net')
        .where('g.dateOfService >= :from AND g.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .groupBy('u.id')
        .addGroupBy('u.name')
        .getRawMany(),

      // Water Supply
      this.wsRepo.createQueryBuilder('ws')
        .select('COUNT(ws.id)', 'count')
        .addSelect('SUM(ws.amountCharged)', 'gross')
        .addSelect('SUM(ws.amountCharged - COALESCE(ws.officialFee, 0))', 'net')
        .where('ws.dateOfService >= :from AND ws.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .getRawOne(),
      this.wsRepo.createQueryBuilder('ws')
        .select('ws.dateOfService', 'date')
        .addSelect('SUM(ws.amountCharged - COALESCE(ws.officialFee, 0))', 'net')
        .where('ws.dateOfService >= :from AND ws.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .groupBy('ws.dateOfService')
        .getRawMany(),
      this.wsRepo.createQueryBuilder('ws')
        .innerJoin('ws.createdBy', 'u')
        .select('u.id', 'userId')
        .addSelect('u.name', 'userName')
        .addSelect('SUM(ws.amountCharged)', 'gross')
        .addSelect('SUM(ws.amountCharged - COALESCE(ws.officialFee, 0))', 'net')
        .where('ws.dateOfService >= :from AND ws.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .groupBy('u.id')
        .addGroupBy('u.name')
        .getRawMany(),

      // Property Tax
      this.ptRepo.createQueryBuilder('pt')
        .select('COUNT(pt.id)', 'count')
        .addSelect('SUM(pt.amountCharged)', 'gross')
        .addSelect('SUM(pt.amountCharged - COALESCE(pt.officialFee, 0) - COALESCE(pt.protocolFee, 0))', 'net')
        .where('pt.dateOfService >= :from AND pt.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .getRawOne(),
      this.ptRepo.createQueryBuilder('pt')
        .select('pt.dateOfService', 'date')
        .addSelect('SUM(pt.amountCharged - COALESCE(pt.officialFee, 0) - COALESCE(pt.protocolFee, 0))', 'net')
        .where('pt.dateOfService >= :from AND pt.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .groupBy('pt.dateOfService')
        .getRawMany(),
      this.ptRepo.createQueryBuilder('pt')
        .innerJoin('pt.createdBy', 'u')
        .select('u.id', 'userId')
        .addSelect('u.name', 'userName')
        .addSelect('SUM(pt.amountCharged)', 'gross')
        .addSelect('SUM(pt.amountCharged - COALESCE(pt.officialFee, 0) - COALESCE(pt.protocolFee, 0))', 'net')
        .where('pt.dateOfService >= :from AND pt.dateOfService <= :to', { from: actualFrom, to: actualTo })
        .groupBy('u.id')
        .addGroupBy('u.name')
        .getRawMany(),

      // Expenses
      this.expenseRepo.createQueryBuilder('e')
        .select('SUM(e.amount)', 'amount')
        .where('e.date >= :from AND e.date <= :to', { from: actualFrom, to: actualTo })
        .getRawOne(),
      this.expenseRepo.createQueryBuilder('e')
        .select('e.date', 'date')
        .addSelect('SUM(e.amount)', 'amount')
        .where('e.date >= :from AND e.date <= :to', { from: actualFrom, to: actualTo })
        .groupBy('e.date')
        .getRawMany(),
      this.expenseRepo.createQueryBuilder('e')
        .innerJoin('e.user', 'u')
        .select('u.id', 'userId')
        .addSelect('u.name', 'userName')
        .addSelect('SUM(e.amount)', 'expenses')
        .where('e.date >= :from AND e.date <= :to', { from: actualFrom, to: actualTo })
        .groupBy('u.id')
        .addGroupBy('u.name')
        .getRawMany(),
    ]);

    const affCount = Number(affStats?.count || 0);
    const affEarnings = Number(affStats?.gross || 0);
    const affNetEarnings = Number(affStats?.net || 0);

    const marCount = Number(marStats?.count || 0);
    const marEarnings = Number(marStats?.gross || 0);
    const marNetEarnings = Number(marStats?.net || 0);

    const bdCount = Number(bdStats?.count || 0);
    const bdEarnings = Number(bdStats?.gross || 0);

    const pcCount = Number(pcStats?.count || 0);
    const pcEarnings = Number(pcStats?.gross || 0);

    const salCount = Number(salStats?.count || 0);
    const salEarnings = Number(salStats?.gross || 0);

    const tlCount = Number(tlStats?.count || 0);
    const tlEarnings = Number(tlStats?.gross || 0);
    const tlNetEarnings = Number(tlStats?.net || 0);

    const panCount = Number(panStats?.count || 0);
    const panEarnings = Number(panStats?.gross || 0);
    const panNetEarnings = Number(panStats?.net || 0);

    const passportCount = Number(passportStats?.count || 0);
    const passportEarnings = Number(passportStats?.gross || 0);
    const passportNetEarnings = Number(passportStats?.net || 0);

    const voterCount = Number(voterStats?.count || 0);
    const voterEarnings = Number(voterStats?.gross || 0);
    const voterNetEarnings = Number(voterStats?.net || 0);

    const gazetteCount = Number(gazetteStats?.count || 0);
    const gazetteEarnings = Number(gazetteStats?.gross || 0);
    const gazetteNetEarnings = Number(gazetteStats?.net || 0);

    const wsCount = Number(wsStats?.count || 0);
    const wsEarnings = Number(wsStats?.gross || 0);
    const wsNetEarnings = Number(wsStats?.net || 0);

    const ptCount = Number(ptStats?.count || 0);
    const ptEarnings = Number(ptStats?.gross || 0);
    const ptNetEarnings = Number(ptStats?.net || 0);

    const totalExpenses = Number(expenseStats?.amount || 0);

    const byAct: Record<string, number> = {};
    for (const r of marActRaw) {
      if (r.marriageAct) {
        byAct[r.marriageAct] = Number(r.count || 0);
      }
    }
    const byAuthorizer: Record<string, number> = {};
    for (const r of affAuthRaw) {
      if (r.authorizerType) {
        byAuthorizer[r.authorizerType] = Number(r.count || 0);
      }
    }
    const byPaper: Record<string, number> = {};
    for (const r of affPaperRaw) {
      if (r.paperType) {
        byPaper[r.paperType] = Number(r.count || 0);
      }
    }
    const byType: Record<string, number> = {};
    for (const r of bdTypeRaw) {
      if (r.certificateType) {
        byType[r.certificateType] = Number(r.count || 0);
      }
    }
    const byCardType: Record<string, number> = {};
    for (const r of pcTypeRaw) {
      if (r.recordType) {
        byCardType[r.recordType] = Number(r.count || 0);
      }
    }

    // KMC Services Module
    const kmcCount = marCount + bdCount + tlCount + wsCount + ptCount;
    const kmcGross = marEarnings + bdEarnings + tlEarnings + wsEarnings + ptEarnings;
    const kmcNet = marNetEarnings + bdEarnings + tlNetEarnings + wsNetEarnings + ptNetEarnings;

    // CSC Services Module
    const cscCount = panCount + passportCount;
    const cscGross = panEarnings + passportEarnings;
    const cscNet = panNetEarnings + passportNetEarnings;

    // Aaple Sarkar Services Module
    const aapleSarkarCount = affCount + pcCount + salCount + gazetteCount + voterCount;
    const aapleSarkarGross = affEarnings + pcEarnings + salEarnings + gazetteEarnings + voterEarnings;
    const aapleSarkarNet = affNetEarnings + pcEarnings + salEarnings + gazetteNetEarnings + voterNetEarnings;

    const modules = {
      kmc: {
        label: 'KMC Services',
        grossEarnings: kmcGross,
        netEarnings: kmcNet,
        count: kmcCount,
        subServices: {
          marriages: {
            label: 'Marriages',
            grossEarnings: marEarnings,
            netEarnings: marNetEarnings,
            count: marCount
          },
          birthDeath: {
            label: 'Birth/Death',
            grossEarnings: bdEarnings,
            netEarnings: bdEarnings,
            count: bdCount
          },
          tradeLicenses: {
            label: 'Trade Licenses',
            grossEarnings: tlEarnings,
            netEarnings: tlNetEarnings,
            count: tlCount
          },
          waterSupply: {
            label: 'Water Supply',
            grossEarnings: wsEarnings,
            netEarnings: wsNetEarnings,
            count: wsCount
          },
          propertyTaxes: {
            label: 'Property Tax',
            grossEarnings: ptEarnings,
            netEarnings: ptNetEarnings,
            count: ptCount
          }
        }
      },
      csc: {
        label: 'CSC Services',
        grossEarnings: cscGross,
        netEarnings: cscNet,
        count: cscCount,
        subServices: {
          panCards: {
            label: 'PAN Cards',
            grossEarnings: panEarnings,
            netEarnings: panNetEarnings,
            count: panCount
          },
          passports: {
            label: 'Passports',
            grossEarnings: passportEarnings,
            netEarnings: passportNetEarnings,
            count: passportCount
          }
        }
      },
      aapleSarkar: {
        label: 'Aaple Sarkar Services',
        grossEarnings: aapleSarkarGross,
        netEarnings: aapleSarkarNet,
        count: aapleSarkarCount,
        subServices: {
          affidavits: {
            label: 'Affidavits',
            grossEarnings: affEarnings,
            netEarnings: affNetEarnings,
            count: affCount
          },
          propertyCards: {
            label: 'Property Cards',
            grossEarnings: pcEarnings,
            netEarnings: pcEarnings,
            count: pcCount
          },
          shopAct: {
            label: 'Shop Act',
            grossEarnings: salEarnings,
            netEarnings: salEarnings,
            count: salCount
          },
          gazettes: {
            label: 'Gazettes',
            grossEarnings: gazetteEarnings,
            netEarnings: gazetteNetEarnings,
            count: gazetteCount
          },
          voterCards: {
            label: 'Voter Cards',
            grossEarnings: voterEarnings,
            netEarnings: voterNetEarnings,
            count: voterCount
          }
        }
      }
    };

    // Calculate daily earnings series
    const dailyMap: Record<string, any> = {};
    const dates: string[] = [];
    const current = new Date(actualFrom);
    const end = new Date(actualTo);
    let safetyCounter = 0;

    while (current <= end && safetyCounter < 366) {
      safetyCounter++;
      const dStr = current.toISOString().split('T')[0];
      dates.push(dStr);
      dailyMap[dStr] = {
        date: dStr,
        affidavits: 0,
        marriages: 0,
        birthDeath: 0,
        propertyCards: 0,
        shopAct: 0,
        tradeLicenses: 0,
        panCards: 0,
        passports: 0,
        voterCards: 0,
        gazettes: 0,
        waterSupply: 0,
        propertyTax: 0,
        kmc: 0,
        csc: 0,
        total: 0,
        expenses: 0,
      };
      current.setDate(current.getDate() + 1);
    }

    const addDailyNet = (rows: any[], serviceKey: string, isExpense = false) => {
      for (const r of rows) {
        if (!r.date) continue;
        const dateStr = r.date instanceof Date ? r.date.toISOString() : String(r.date);
        const normalizedDate = dateStr.split('T')[0];
        if (dailyMap[normalizedDate]) {
          const val = Number(r.net || r.amount || 0);
          if (isExpense) {
            dailyMap[normalizedDate].expenses += val;
          } else {
            dailyMap[normalizedDate][serviceKey] += val;
          }
        }
      }
    };

    addDailyNet(affDailyRaw, 'affidavits');
    addDailyNet(marDailyRaw, 'marriages');
    addDailyNet(bdDailyRaw, 'birthDeath');
    addDailyNet(pcDailyRaw, 'propertyCards');
    addDailyNet(salDailyRaw, 'shopAct');
    addDailyNet(tlDailyRaw, 'tradeLicenses');
    addDailyNet(panDailyRaw, 'panCards');
    addDailyNet(passportDailyRaw, 'passports');
    addDailyNet(voterDailyRaw, 'voterCards');
    addDailyNet(gazetteDailyRaw, 'gazettes');
    addDailyNet(wsDailyRaw, 'waterSupply');
    addDailyNet(ptDailyRaw, 'propertyTax');
    addDailyNet(expenseDailyRaw, '', true);

    for (const dStr of dates) {
      const pt = dailyMap[dStr];
      pt.kmc = pt.marriages + pt.birthDeath + pt.tradeLicenses + pt.waterSupply + pt.propertyTax;
      pt.csc = pt.panCards + pt.passports;
      pt.aapleSarkar = pt.affidavits + pt.propertyCards + pt.shopAct + pt.gazettes + pt.voterCards;
      pt.total = pt.kmc + pt.csc + pt.aapleSarkar - pt.expenses;
    }

    const userBreakdowns: Record<string, { userId: string; userName: string; gross: number; net: number; expenses: number }> = {};

    const addUserStats = (rows: any[], isExpense = false) => {
      for (const r of rows) {
        const id = r.userId || 'unknown';
        const name = r.userName || 'Unknown User';
        if (!userBreakdowns[id]) {
          userBreakdowns[id] = { userId: id, userName: name, gross: 0, net: 0, expenses: 0 };
        }
        const grossVal = Number(r.gross || 0);
        const netVal = Number(r.net || 0);
        const expenseVal = Number(r.expenses || 0);
        if (isExpense) {
          userBreakdowns[id].expenses += expenseVal;
          userBreakdowns[id].net -= expenseVal;
        } else {
          userBreakdowns[id].gross += grossVal;
          userBreakdowns[id].net += netVal;
        }
      }
    };

    addUserStats(affUserRaw);
    addUserStats(marUserRaw);
    addUserStats(bdUserRaw);
    addUserStats(pcUserRaw);
    addUserStats(salUserRaw);
    addUserStats(tlUserRaw);
    addUserStats(panUserRaw);
    addUserStats(passportUserRaw);
    addUserStats(voterUserRaw);
    addUserStats(gazetteUserRaw);
    addUserStats(wsUserRaw);
    addUserStats(ptUserRaw);
    addUserStats(expenseUserRaw, true);

    const userBreakdownList = Object.values(userBreakdowns);
    const dailyEarnings = dates.map((dStr) => dailyMap[dStr]);

    const result = {
      fromDate: actualFrom,
      toDate: actualTo,
      affidavitCount: affCount,
      marriageCount: marCount,
      birthDeathCount: bdCount,
      propertyCardCount: pcCount,
      shopActLicenseCount: salCount,
      tradeLicenseCount: tlCount,
      panCardCount: panCount,
      passportCount: passportCount,
      voterCardCount: voterCount,
      gazetteCount: gazetteCount,
      waterSupplyCount: wsCount,
      propertyTaxCount: ptCount,
      affidavitEarnings: affEarnings,
      affidavitGrossEarnings: affEarnings,
      affidavitNetEarnings: affNetEarnings,
      marriageEarnings: marEarnings,
      birthDeathEarnings: bdEarnings,
      propertyCardEarnings: pcEarnings,
      shopActLicenseEarnings: salEarnings,
      tradeLicenseEarnings: tlEarnings,
      tradeLicenseNetEarnings: tlNetEarnings,
      panCardEarnings: panEarnings,
      passportEarnings: passportEarnings,
      voterCardEarnings: voterEarnings,
      gazetteEarnings: gazetteEarnings,
      gazetteNetEarnings: gazetteNetEarnings,
      waterSupplyEarnings: wsEarnings,
      waterSupplyNetEarnings: wsNetEarnings,
      propertyTaxEarnings: ptEarnings,
      propertyTaxNetEarnings: ptNetEarnings,
      totalEarnings: affEarnings + marEarnings + bdEarnings + pcEarnings + salEarnings + tlEarnings + panEarnings + passportEarnings + voterEarnings + gazetteEarnings + wsEarnings + ptEarnings,
      totalNetEarnings: affNetEarnings + marNetEarnings + bdEarnings + pcEarnings + salEarnings + tlNetEarnings + panNetEarnings + passportNetEarnings + voterNetEarnings + gazetteNetEarnings + wsNetEarnings + ptNetEarnings - totalExpenses,
      totalExpenses,
      modules,
      breakdown: { byAct, byAuthorizer, byPaper, byType, byCardType },
      dailyEarnings,
      userBreakdown: userBreakdownList,
    };

    console.timeEnd(`Dashboard Query Execution [${actualFrom} to ${actualTo}]`);
    this.cache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  }

}
