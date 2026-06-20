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

@Injectable()
export class DashboardService {
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

    const affQb = this.affRepo.createQueryBuilder('a');
    const marQb = this.marRepo.createQueryBuilder('m');
    const bdQb = this.bdRepo.createQueryBuilder('b');
    const pcQb = this.pcRepo.createQueryBuilder('p');
    const salQb = this.salRepo.createQueryBuilder('s');
    const tlQb = this.tlRepo.createQueryBuilder('t');
    const panQb = this.panRepo.createQueryBuilder('pan');
    const passportQb = this.passportRepo.createQueryBuilder('pass');
    const gazetteQb = this.gazetteRepo.createQueryBuilder('g');

    affQb.andWhere('a.dateOfService >= :from', { from: actualFrom });
    marQb.andWhere('m.dateOfService >= :from', { from: actualFrom });
    bdQb.andWhere('b.dateOfService >= :from', { from: actualFrom });
    pcQb.andWhere('p.dateOfService >= :from', { from: actualFrom });
    salQb.andWhere('s.dateOfService >= :from', { from: actualFrom });
    tlQb.andWhere('t.dateOfService >= :from', { from: actualFrom });
    panQb.andWhere('pan.dateOfService >= :from', { from: actualFrom });
    passportQb.andWhere('pass.dateOfService >= :from', { from: actualFrom });
    gazetteQb.andWhere('g.dateOfService >= :from', { from: actualFrom });

    affQb.andWhere('a.dateOfService <= :to', { to: actualTo });
    marQb.andWhere('m.dateOfService <= :to', { to: actualTo });
    bdQb.andWhere('b.dateOfService <= :to', { to: actualTo });
    pcQb.andWhere('p.dateOfService <= :to', { to: actualTo });
    salQb.andWhere('s.dateOfService <= :to', { to: actualTo });
    tlQb.andWhere('t.dateOfService <= :to', { to: actualTo });
    panQb.andWhere('pan.dateOfService <= :to', { to: actualTo });
    passportQb.andWhere('pass.dateOfService <= :to', { to: actualTo });
    gazetteQb.andWhere('g.dateOfService <= :to', { to: actualTo });

    const [
      affidavits, marriages, birthDeathCerts, propertyCards, shopActLicenses, tradeLicenses,
      panCards, passports, pricingList, gazettes
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

    const gazetteEarnings = gazettes.reduce((s, r) => s + Number(r.amountCharged), 0);
    const gazetteNetEarnings = gazettes.reduce((s, r) => s + (Number(r.amountCharged) - Number(r.officialFee || 0)), 0);

    const byAct = marriages.reduce((acc, m) => { acc[m.marriageAct] = (acc[m.marriageAct] || 0) + 1; return acc; }, {} as Record<string, number>);
    const byAuthorizer = affidavits.reduce((acc, a) => { acc[a.authorizerType] = (acc[a.authorizerType] || 0) + 1; return acc; }, {} as Record<string, number>);
    const byPaper = affidavits.reduce((acc, a) => { acc[a.paperType] = (acc[a.paperType] || 0) + 1; return acc; }, {} as Record<string, number>);
    const byType = birthDeathCerts.reduce((acc, b) => { acc[b.certificateType] = (acc[b.certificateType] || 0) + 1; return acc; }, {} as Record<string, number>);
    const byCardType = propertyCards.reduce((acc, p) => { acc[p.recordType] = (acc[p.recordType] || 0) + 1; return acc; }, {} as Record<string, number>);

    // KMC Services Module
    const kmcCount = marriages.length + birthDeathCerts.length + tradeLicenses.length;
    const kmcGross = marEarnings + bdEarnings + tlEarnings;
    const kmcNet = marEarnings + bdEarnings + tlNetEarnings;

    // CSC Services Module
    const cscCount = panCards.length + passports.length;
    const cscGross = panEarnings + passportEarnings;
    const cscNet = panNetEarnings + passportNetEarnings;

    // Aaple Sarkar Services Module
    const aapleSarkarCount = affidavits.length + propertyCards.length + shopActLicenses.length + gazettes.length;
    const aapleSarkarGross = affEarnings + pcEarnings + salEarnings + gazetteEarnings;
    const aapleSarkarNet = affNetEarnings + pcEarnings + salEarnings + gazetteNetEarnings;

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
        gazettes: 0,
        kmc: 0,
        csc: 0,
        aapleSarkar: 0,
        total: 0,
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

    for (const r of gazettes) {
      const net = Number(r.amountCharged) - Number(r.officialFee || 0);
      addNet(r.dateOfService, 'gazettes', net);
    }

    for (const dStr of dates) {
      const pt = dailyMap[dStr];
      pt.kmc = pt.marriages + pt.birthDeath + pt.tradeLicenses;
      pt.csc = pt.panCards + pt.passports;
      pt.aapleSarkar = pt.affidavits + pt.propertyCards + pt.shopAct + pt.gazettes;
      pt.total = pt.kmc + pt.csc + pt.aapleSarkar;
    }

    const dailyEarnings = dates.map((dStr) => dailyMap[dStr]);

    return {
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
      gazetteCount: gazettes.length,
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
      gazetteEarnings: gazetteEarnings,
      gazetteNetEarnings: gazetteNetEarnings,
      totalEarnings: affEarnings + marEarnings + bdEarnings + pcEarnings + salEarnings + tlEarnings + panEarnings + passportEarnings + gazetteEarnings,
      totalNetEarnings: affNetEarnings + marEarnings + bdEarnings + pcEarnings + salEarnings + tlNetEarnings + panNetEarnings + passportNetEarnings + gazetteNetEarnings,
      modules,
      breakdown: { byAct, byAuthorizer, byPaper, byType, byCardType },
      dailyEarnings,
    };
  }
}
