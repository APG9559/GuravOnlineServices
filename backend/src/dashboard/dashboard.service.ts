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

    affQb.andWhere('a.dateOfService >= :from', { from: actualFrom });
    marQb.andWhere('m.dateOfService >= :from', { from: actualFrom });
    bdQb.andWhere('b.dateOfService >= :from', { from: actualFrom });
    pcQb.andWhere('p.dateOfService >= :from', { from: actualFrom });
    salQb.andWhere('s.dateOfService >= :from', { from: actualFrom });
    tlQb.andWhere('t.dateOfService >= :from', { from: actualFrom });
    panQb.andWhere('pan.dateOfService >= :from', { from: actualFrom });
    passportQb.andWhere('pass.dateOfService >= :from', { from: actualFrom });

    affQb.andWhere('a.dateOfService <= :to', { to: actualTo });
    marQb.andWhere('m.dateOfService <= :to', { to: actualTo });
    bdQb.andWhere('b.dateOfService <= :to', { to: actualTo });
    pcQb.andWhere('p.dateOfService <= :to', { to: actualTo });
    salQb.andWhere('s.dateOfService <= :to', { to: actualTo });
    tlQb.andWhere('t.dateOfService <= :to', { to: actualTo });
    panQb.andWhere('pan.dateOfService <= :to', { to: actualTo });
    passportQb.andWhere('pass.dateOfService <= :to', { to: actualTo });

    const [
      affidavits, marriages, birthDeathCerts, propertyCards, shopActLicenses, tradeLicenses,
      panCards, passports, pricingList
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
    const aapleSarkarCount = affidavits.length + propertyCards.length + shopActLicenses.length;
    const aapleSarkarGross = affEarnings + pcEarnings + salEarnings;
    const aapleSarkarNet = affNetEarnings + pcEarnings + salEarnings;

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
          }
        }
      }
    };

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
      totalEarnings: affEarnings + marEarnings + bdEarnings + pcEarnings + salEarnings + tlEarnings + panEarnings + passportEarnings,
      totalNetEarnings: affNetEarnings + marEarnings + bdEarnings + pcEarnings + salEarnings + tlNetEarnings + panNetEarnings + passportNetEarnings,
      modules,
      breakdown: { byAct, byAuthorizer, byPaper, byType, byCardType },
    };
  }
}
