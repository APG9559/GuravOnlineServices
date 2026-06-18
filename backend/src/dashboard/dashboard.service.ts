import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Affidavit } from '../affidavits/affidavit.entity';
import { Marriage } from '../marriages/marriage.entity';
import { BirthDeathCertificate } from '../birth-death-certificates/birth-death-certificate.entity';
import { PropertyCard } from '../property-cards/property-card.entity';
import { ShopActLicense } from '../shop-act-licenses/shop-act-license.entity';
import { PricingSetting } from '../settings/pricing-setting.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Affidavit) private readonly affRepo: Repository<Affidavit>,
    @InjectRepository(Marriage) private readonly marRepo: Repository<Marriage>,
    @InjectRepository(BirthDeathCertificate) private readonly bdRepo: Repository<BirthDeathCertificate>,
    @InjectRepository(PropertyCard) private readonly pcRepo: Repository<PropertyCard>,
    @InjectRepository(ShopActLicense) private readonly salRepo: Repository<ShopActLicense>,
    @InjectRepository(PricingSetting) private readonly pricingRepo: Repository<PricingSetting>,
  ) { }

  async getSummary(from?: string, to?: string) {
    const affQb = this.affRepo.createQueryBuilder('a');
    const marQb = this.marRepo.createQueryBuilder('m');
    const bdQb = this.bdRepo.createQueryBuilder('b');
    const pcQb = this.pcRepo.createQueryBuilder('p');
    const salQb = this.salRepo.createQueryBuilder('s');

    if (from) {
      affQb.andWhere('a.dateOfService >= :from', { from });
      marQb.andWhere('m.dateOfService >= :from', { from });
      bdQb.andWhere('b.dateOfService >= :from', { from });
      pcQb.andWhere('p.dateOfService >= :from', { from });
      salQb.andWhere('s.dateOfService >= :from', { from });
    }
    if (to) {
      affQb.andWhere('a.dateOfService <= :to', { to });
      marQb.andWhere('m.dateOfService <= :to', { to });
      bdQb.andWhere('b.dateOfService <= :to', { to });
      pcQb.andWhere('p.dateOfService <= :to', { to });
      salQb.andWhere('s.dateOfService <= :to', { to });
    }

    const [affidavits, marriages, birthDeathCerts, propertyCards, shopActLicenses, pricingList] =
      await Promise.all([
        affQb.getMany(),
        marQb.getMany(),
        bdQb.getMany(),
        pcQb.getMany(),
        salQb.getMany(),
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

    const byAct = marriages.reduce((acc, m) => { acc[m.marriageAct] = (acc[m.marriageAct] || 0) + 1; return acc; }, {} as Record<string, number>);
    const byAuthorizer = affidavits.reduce((acc, a) => { acc[a.authorizerType] = (acc[a.authorizerType] || 0) + 1; return acc; }, {} as Record<string, number>);
    const byPaper = affidavits.reduce((acc, a) => { acc[a.paperType] = (acc[a.paperType] || 0) + 1; return acc; }, {} as Record<string, number>);
    const byType = birthDeathCerts.reduce((acc, b) => { acc[b.certificateType] = (acc[b.certificateType] || 0) + 1; return acc; }, {} as Record<string, number>);
    const byCardType = propertyCards.reduce((acc, p) => { acc[p.recordType] = (acc[p.recordType] || 0) + 1; return acc; }, {} as Record<string, number>);

    return {
      affidavitCount: affidavits.length,
      marriageCount: marriages.length,
      birthDeathCount: birthDeathCerts.length,
      propertyCardCount: propertyCards.length,
      shopActLicenseCount: shopActLicenses.length,
      affidavitEarnings: affEarnings,
      affidavitGrossEarnings: affEarnings,
      affidavitNetEarnings: affNetEarnings,
      marriageEarnings: marEarnings,
      birthDeathEarnings: bdEarnings,
      propertyCardEarnings: pcEarnings,
      shopActLicenseEarnings: salEarnings,
      totalEarnings: affEarnings + marEarnings + bdEarnings + pcEarnings + salEarnings,
      totalNetEarnings: affNetEarnings + marEarnings + bdEarnings + pcEarnings + salEarnings,
      breakdown: { byAct, byAuthorizer, byPaper, byType, byCardType },
    };
  }
}
