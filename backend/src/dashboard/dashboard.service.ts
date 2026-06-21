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

    const affQb = this.affRepo.createQueryBuilder('a')
      .leftJoinAndSelect('a.createdBy', 'u')
      .select(['a.id', 'a.amountCharged', 'a.dateOfService', 'a.paperType', 'a.authorizerType', 'a.customerBroughtStamp', 'a.notaryPublicFee', 'u.id', 'u.name']);
    const marQb = this.marRepo.createQueryBuilder('m')
      .leftJoinAndSelect('m.createdBy', 'u')
      .select(['m.id', 'm.amountCharged', 'm.dateOfService', 'm.marriageAct', 'u.id', 'u.name']);
    const bdQb = this.bdRepo.createQueryBuilder('b')
      .leftJoinAndSelect('b.createdBy', 'u')
      .select(['b.id', 'b.amountCharged', 'b.dateOfService', 'b.certificateType', 'u.id', 'u.name']);
    const pcQb = this.pcRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.createdBy', 'u')
      .select(['p.id', 'p.amountCharged', 'p.dateOfService', 'p.recordType', 'u.id', 'u.name']);
    const salQb = this.salRepo.createQueryBuilder('s')
      .leftJoinAndSelect('s.createdBy', 'u')
      .select(['s.id', 's.amountCharged', 's.dateOfService', 'u.id', 'u.name']);
    const tlQb = this.tlRepo.createQueryBuilder('t')
      .leftJoinAndSelect('t.createdBy', 'u')
      .select(['t.id', 't.amountCharged', 't.officialFee', 't.protocolFee', 't.dateOfService', 'u.id', 'u.name']);
    const panQb = this.panRepo.createQueryBuilder('pan')
      .leftJoinAndSelect('pan.createdBy', 'u')
      .select(['pan.id', 'pan.amountCharged', 'pan.officialFee', 'pan.dateOfService', 'u.id', 'u.name']);
    const passportQb = this.passportRepo.createQueryBuilder('pass')
      .leftJoinAndSelect('pass.createdBy', 'u')
      .select(['pass.id', 'pass.amountCharged', 'pass.officialFee', 'pass.dateOfService', 'u.id', 'u.name']);
    const gazetteQb = this.gazetteRepo.createQueryBuilder('g')
      .leftJoinAndSelect('g.createdBy', 'u')
      .select(['g.id', 'g.amountCharged', 'g.officialFee', 'g.dateOfService', 'u.id', 'u.name']);
    const wsQb = this.wsRepo.createQueryBuilder('ws')
      .leftJoinAndSelect('ws.createdBy', 'u')
      .select(['ws.id', 'ws.amountCharged', 'ws.officialFee', 'ws.dateOfService', 'ws.serviceType', 'u.id', 'u.name']);
    const ptQb = this.ptRepo.createQueryBuilder('pt')
      .leftJoinAndSelect('pt.createdBy', 'u')
      .select(['pt.id', 'pt.amountCharged', 'pt.officialFee', 'pt.protocolFee', 'pt.dateOfService', 'pt.serviceType', 'u.id', 'u.name']);
    const voterQb = this.voterRepo.createQueryBuilder('v')
      .leftJoinAndSelect('v.createdBy', 'u')
      .select(['v.id', 'v.amountCharged', 'v.officialFee', 'v.dateOfService', 'u.id', 'u.name']);
    const expenseQb = this.expenseRepo.createQueryBuilder('e')
      .leftJoinAndSelect('e.user', 'u')
      .select(['e.id', 'e.amount', 'e.date', 'u.id', 'u.name']);
 
    affQb.andWhere('a.dateOfService >= :from', { from: actualFrom });
    marQb.andWhere('m.dateOfService >= :from', { from: actualFrom });
    bdQb.andWhere('b.dateOfService >= :from', { from: actualFrom });
    pcQb.andWhere('p.dateOfService >= :from', { from: actualFrom });
    salQb.andWhere('s.dateOfService >= :from', { from: actualFrom });
    tlQb.andWhere('t.dateOfService >= :from', { from: actualFrom });
    panQb.andWhere('pan.dateOfService >= :from', { from: actualFrom });
    passportQb.andWhere('pass.dateOfService >= :from', { from: actualFrom });
    gazetteQb.andWhere('g.dateOfService >= :from', { from: actualFrom });
    wsQb.andWhere('ws.dateOfService >= :from', { from: actualFrom });
    ptQb.andWhere('pt.dateOfService >= :from', { from: actualFrom });
    voterQb.andWhere('v.dateOfService >= :from', { from: actualFrom });
    expenseQb.andWhere('e.date >= :from', { from: actualFrom });
 
    affQb.andWhere('a.dateOfService <= :to', { to: actualTo });
    marQb.andWhere('m.dateOfService <= :to', { to: actualTo });
    bdQb.andWhere('b.dateOfService <= :to', { to: actualTo });
    pcQb.andWhere('p.dateOfService <= :to', { to: actualTo });
    salQb.andWhere('s.dateOfService <= :to', { to: actualTo });
    tlQb.andWhere('t.dateOfService <= :to', { to: to || actualTo });
    panQb.andWhere('pan.dateOfService <= :to', { to: actualTo });
    passportQb.andWhere('pass.dateOfService <= :to', { to: actualTo });
    gazetteQb.andWhere('g.dateOfService <= :to', { to: actualTo });
    wsQb.andWhere('ws.dateOfService <= :to', { to: actualTo });
    ptQb.andWhere('pt.dateOfService <= :to', { to: actualTo });
    voterQb.andWhere('v.dateOfService <= :to', { to: actualTo });
    expenseQb.andWhere('e.date <= :to', { to: actualTo });

    const [
      affidavits, marriages, birthDeathCerts, propertyCards, shopActLicenses, tradeLicenses,
      panCards, passports, pricingList, gazettes, waterSupplies, propertyTaxes, voterCards,
      expenses
    ] = await Promise.all([
      affQb.getMany(),
      marQb.getMany(),
      bdQb.getMany(),
      pcQb.getMany(),
      salQb.getMany(),
      tlQb.getMany(),
      panQb.getMany(),
      passportQb.getMany(),
      this.pricingRepo.find(),
      gazetteQb.getMany(),
      wsQb.getMany(),
      ptQb.getMany(),
      voterQb.getMany(),
      expenseQb.getMany(),
    ]);

    const pricing = pricingList.reduce((acc, r) => {
      acc[r.key] = Number(r.value);
      return acc;
    }, {} as Record<string, number>);

    const stampCost = pricing['stamp500_cost'] ?? 500;
    const plainCost = pricing['plain_cost'] ?? 0;

    const affEarnings = affidavits.reduce((s, r) => s + Number(r.amountCharged), 0);
    const affNetEarnings = affidavits.reduce((s, r) => {
      const pCost = r.customerBroughtStamp ? 0 : (r.paperType === 'stamp500' ? stampCost : plainCost);
      const deduction = r.authorizerType === 'magistrate' ? 30 : Number(r.notaryPublicFee ?? 0);
      return s + (Number(r.amountCharged) - pCost - deduction);
    }, 0);

    const marEarnings = marriages.reduce((s, r) => s + Number(r.amountCharged), 0);
    const bdEarnings = birthDeathCerts.reduce((s, r) => s + Number(r.amountCharged), 0);
    const pcEarnings = propertyCards.reduce((s, r) => s + Number(r.amountCharged), 0);
    const salEarnings = shopActLicenses.reduce((s, r) => s + Number(r.amountCharged), 0);
    const tlEarnings = tradeLicenses.reduce((s, r) => s + Number(r.amountCharged), 0);
    const tlNetEarnings = tradeLicenses.reduce((s, r) => s + (Number(r.amountCharged) - Number(r.officialFee) - Number(r.protocolFee || 0)), 0);

    const panEarnings = panCards.reduce((s, r) => s + Number(r.amountCharged), 0);
    const panNetEarnings = panCards.reduce((s, r) => s + (Number(r.amountCharged) - Number(r.officialFee || 0)), 0);

    const passportEarnings = passports.reduce((s, r) => s + Number(r.amountCharged), 0);
    const passportNetEarnings = passports.reduce((s, r) => s + (Number(r.amountCharged) - Number(r.officialFee || 0)), 0);

    const voterEarnings = voterCards.reduce((s, r) => s + Number(r.amountCharged), 0);
    const voterNetEarnings = voterCards.reduce((s, r) => s + (Number(r.amountCharged) - Number(r.officialFee || 0)), 0);

    const gazetteEarnings = gazettes.reduce((s, r) => s + Number(r.amountCharged), 0);
    const gazetteNetEarnings = gazettes.reduce((s, r) => s + (Number(r.amountCharged) - Number(r.officialFee || 0)), 0);

    const wsEarnings = waterSupplies.reduce((s, r) => s + Number(r.amountCharged), 0);
    const wsNetEarnings = waterSupplies.reduce((s, r) => s + (Number(r.amountCharged) - Number(r.officialFee || 0)), 0);

    const ptEarnings = propertyTaxes.reduce((s, r) => s + Number(r.amountCharged), 0);
    const ptNetEarnings = propertyTaxes.reduce((s, r) => s + (Number(r.amountCharged) - Number(r.officialFee) - Number(r.protocolFee || 0)), 0);

    const byAct = marriages.reduce((acc, m) => { acc[m.marriageAct] = (acc[m.marriageAct] || 0) + 1; return acc; }, {} as Record<string, number>);
    const byAuthorizer = affidavits.reduce((acc, a) => { acc[a.authorizerType] = (acc[a.authorizerType] || 0) + 1; return acc; }, {} as Record<string, number>);
    const byPaper = affidavits.reduce((acc, a) => { acc[a.paperType] = (acc[a.paperType] || 0) + 1; return acc; }, {} as Record<string, number>);
    const byType = birthDeathCerts.reduce((acc, b) => { acc[b.certificateType] = (acc[b.certificateType] || 0) + 1; return acc; }, {} as Record<string, number>);
    const byCardType = propertyCards.reduce((acc, p) => { acc[p.recordType] = (acc[p.recordType] || 0) + 1; return acc; }, {} as Record<string, number>);

    // KMC Services Module
    const kmcCount = marriages.length + birthDeathCerts.length + tradeLicenses.length + waterSupplies.length + propertyTaxes.length;
    const kmcGross = marEarnings + bdEarnings + tlEarnings + wsEarnings + ptEarnings;
    const kmcNet = marEarnings + bdEarnings + tlNetEarnings + wsNetEarnings + ptNetEarnings;

    // CSC Services Module
    const cscCount = panCards.length + passports.length;
    const cscGross = panEarnings + passportEarnings;
    const cscNet = panNetEarnings + passportNetEarnings;

    // Aaple Sarkar Services Module
    const aapleSarkarCount = affidavits.length + propertyCards.length + shopActLicenses.length + gazettes.length + voterCards.length;
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
            netEarnings: marEarnings,
            count: marriages.length
          },
          birthDeath: {
            label: 'Birth/Death',
            grossEarnings: bdEarnings,
            netEarnings: bdEarnings,
            count: birthDeathCerts.length
          },
          tradeLicenses: {
            label: 'Trade Licenses',
            grossEarnings: tlEarnings,
            netEarnings: tlNetEarnings,
            count: tradeLicenses.length
          },
          waterSupply: {
            label: 'Water Supply',
            grossEarnings: wsEarnings,
            netEarnings: wsNetEarnings,
            count: waterSupplies.length
          },
          propertyTaxes: {
            label: 'Property Tax',
            grossEarnings: ptEarnings,
            netEarnings: ptNetEarnings,
            count: propertyTaxes.length
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
            count: panCards.length
          },
          passports: {
            label: 'Passports',
            grossEarnings: passportEarnings,
            netEarnings: passportNetEarnings,
            count: passports.length
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
            count: affidavits.length
          },
          propertyCards: {
            label: 'Property Cards',
            grossEarnings: pcEarnings,
            netEarnings: pcEarnings,
            count: propertyCards.length
          },
          shopAct: {
            label: 'Shop Act',
            grossEarnings: salEarnings,
            netEarnings: salEarnings,
            count: shopActLicenses.length
          },
          gazettes: {
            label: 'Gazettes',
            grossEarnings: gazetteEarnings,
            netEarnings: gazetteNetEarnings,
            count: gazettes.length
          },
          voterCards: {
            label: 'Voter Cards',
            grossEarnings: voterEarnings,
            netEarnings: voterNetEarnings,
            count: voterCards.length
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

    const addNet = (date: string, serviceKey: string, value: number) => {
      if (!date) return;
      const normalizedDate = date.split('T')[0];
      if (dailyMap[normalizedDate]) {
        dailyMap[normalizedDate][serviceKey] += value;
      }
    };

    for (const r of affidavits) {
      const pCost = r.customerBroughtStamp ? 0 : (r.paperType === 'stamp500' ? stampCost : plainCost);
      const deduction = r.authorizerType === 'magistrate' ? 30 : Number(r.notaryPublicFee ?? 0);
      const net = Number(r.amountCharged) - pCost - deduction;
      addNet(r.dateOfService, 'affidavits', net);
    }

    for (const r of marriages) {
      addNet(r.dateOfService, 'marriages', Number(r.amountCharged));
    }

    for (const r of birthDeathCerts) {
      addNet(r.dateOfService, 'birthDeath', Number(r.amountCharged));
    }

    for (const r of propertyCards) {
      addNet(r.dateOfService, 'propertyCards', Number(r.amountCharged));
    }

    for (const r of shopActLicenses) {
      addNet(r.dateOfService, 'shopAct', Number(r.amountCharged));
    }

    for (const r of tradeLicenses) {
      const net = Number(r.amountCharged) - Number(r.officialFee) - Number(r.protocolFee || 0);
      addNet(r.dateOfService, 'tradeLicenses', net);
    }

    for (const r of panCards) {
      const net = Number(r.amountCharged) - Number(r.officialFee || 0);
      addNet(r.dateOfService, 'panCards', net);
    }

    for (const r of passports) {
      const net = Number(r.amountCharged) - Number(r.officialFee || 0);
      addNet(r.dateOfService, 'passports', net);
    }

    for (const r of voterCards) {
      const net = Number(r.amountCharged) - Number(r.officialFee || 0);
      addNet(r.dateOfService, 'voterCards', net);
    }

    for (const r of gazettes) {
      const net = Number(r.amountCharged) - Number(r.officialFee || 0);
      addNet(r.dateOfService, 'gazettes', net);
    }

    for (const r of waterSupplies) {
      const net = Number(r.amountCharged) - Number(r.officialFee || 0);
      addNet(r.dateOfService, 'waterSupply', net);
    }

    for (const r of propertyTaxes) {
      const net = Number(r.amountCharged) - Number(r.officialFee) - Number(r.protocolFee || 0);
      addNet(r.dateOfService, 'propertyTax', net);
    }

    for (const r of expenses) {
      const amt = Number(r.amount);
      const dStr = r.date;
      if (dailyMap[dStr]) {
        dailyMap[dStr].expenses += amt;
      }
    }

    for (const dStr of dates) {
      const pt = dailyMap[dStr];
      pt.kmc = pt.marriages + pt.birthDeath + pt.tradeLicenses + pt.waterSupply + pt.propertyTax;
      pt.csc = pt.panCards + pt.passports;
      pt.aapleSarkar = pt.affidavits + pt.propertyCards + pt.shopAct + pt.gazettes + pt.voterCards;
      pt.total = pt.kmc + pt.csc + pt.aapleSarkar - pt.expenses;
    }

    const userBreakdowns: Record<string, { userId: string; userName: string; gross: number; net: number; expenses: number }> = {};

    const addToUser = (userObj: any, grossAmt: number, netAmt: number) => {
      const id = userObj?.id || 'unknown';
      const name = userObj?.name || 'Unknown User';
      if (!userBreakdowns[id]) {
        userBreakdowns[id] = { userId: id, userName: name, gross: 0, net: 0, expenses: 0 };
      }
      userBreakdowns[id].gross += grossAmt;
      userBreakdowns[id].net += netAmt;
    };

    const addExpenseToUser = (userObj: any, expenseAmt: number) => {
      const id = userObj?.id || 'unknown';
      const name = userObj?.name || 'Unknown User';
      if (!userBreakdowns[id]) {
        userBreakdowns[id] = { userId: id, userName: name, gross: 0, net: 0, expenses: 0 };
      }
      userBreakdowns[id].expenses += expenseAmt;
      userBreakdowns[id].net -= expenseAmt;
    };

    affidavits.forEach((r) => {
      const pCost = r.customerBroughtStamp ? 0 : (r.paperType === 'stamp500' ? stampCost : plainCost);
      const deduction = r.authorizerType === 'magistrate' ? 30 : Number(r.notaryPublicFee ?? 0);
      const gross = Number(r.amountCharged);
      const net = gross - pCost - deduction;
      addToUser(r.createdBy, gross, net);
    });

    marriages.forEach((r) => {
      addToUser(r.createdBy, Number(r.amountCharged), Number(r.amountCharged));
    });

    birthDeathCerts.forEach((r) => {
      addToUser(r.createdBy, Number(r.amountCharged), Number(r.amountCharged));
    });

    propertyCards.forEach((r) => {
      addToUser(r.createdBy, Number(r.amountCharged), Number(r.amountCharged));
    });

    shopActLicenses.forEach((r) => {
      addToUser(r.createdBy, Number(r.amountCharged), Number(r.amountCharged));
    });

    tradeLicenses.forEach((r) => {
      const gross = Number(r.amountCharged);
      const net = gross - Number(r.officialFee) - Number(r.protocolFee || 0);
      addToUser(r.createdBy, gross, net);
    });

    panCards.forEach((r) => {
      const gross = Number(r.amountCharged);
      const net = gross - Number(r.officialFee || 0);
      addToUser(r.createdBy, gross, net);
    });

    passports.forEach((r) => {
      const gross = Number(r.amountCharged);
      const net = gross - Number(r.officialFee || 0);
      addToUser(r.createdBy, gross, net);
    });

    voterCards.forEach((r) => {
      const gross = Number(r.amountCharged);
      const net = gross - Number(r.officialFee || 0);
      addToUser(r.createdBy, gross, net);
    });

    gazettes.forEach((r) => {
      const gross = Number(r.amountCharged);
      const net = gross - Number(r.officialFee || 0);
      addToUser(r.createdBy, gross, net);
    });

    waterSupplies.forEach((r) => {
      const gross = Number(r.amountCharged);
      const net = gross - Number(r.officialFee || 0);
      addToUser(r.createdBy, gross, net);
    });

    propertyTaxes.forEach((r) => {
      const gross = Number(r.amountCharged);
      const net = gross - Number(r.officialFee) - Number(r.protocolFee || 0);
      addToUser(r.createdBy, gross, net);
    });

    expenses.forEach((r) => {
      addExpenseToUser(r.user, Number(r.amount));
    });

    const userBreakdownList = Object.values(userBreakdowns);

    const dailyEarnings = dates.map((dStr) => dailyMap[dStr]);
    const totalExpenses = expenses.reduce((s, r) => s + Number(r.amount), 0);

    const result = {
      fromDate: actualFrom,
      toDate: actualTo,
      affidavitCount: affidavits.length,
      marriageCount: marriages.length,
      birthDeathCount: birthDeathCerts.length,
      propertyCardCount: propertyCards.length,
      shopActLicenseCount: shopActLicenses.length,
      tradeLicenseCount: tradeLicenses.length,
      panCardCount: panCards.length,
      passportCount: passports.length,
      voterCardCount: voterCards.length,
      gazetteCount: gazettes.length,
      waterSupplyCount: waterSupplies.length,
      propertyTaxCount: propertyTaxes.length,
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
      totalNetEarnings: affNetEarnings + marEarnings + bdEarnings + pcEarnings + salEarnings + tlNetEarnings + panNetEarnings + passportNetEarnings + voterNetEarnings + gazetteNetEarnings + wsNetEarnings + ptNetEarnings - totalExpenses,
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
