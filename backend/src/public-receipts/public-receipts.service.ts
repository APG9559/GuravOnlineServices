import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Affidavit } from '../affidavits/affidavit.entity';
import { Marriage } from '../marriages/marriage.entity';
import { BirthDeathCertificate } from '../birth-death-certificates/birth-death-certificate.entity';
import { PropertyCard } from '../property-cards/property-card.entity';
import { ShopActLicense } from '../shop-act-licenses/shop-act-license.entity';
import { TradeLicenseRecord } from '../trade-licenses/trade-license-record.entity';
import { PanCardRecord } from '../csc-services/pan-card.entity';
import { PassportRecord } from '../csc-services/passport.entity';
import { Gazette } from '../gazettes/gazette.entity';
import { WaterServiceRecord } from '../water-supply/water-service-record.entity';
import { PropertyTax } from '../property-tax/property-tax.entity';
import { VoterCardRecord } from '../csc-services/voter-card.entity';

@Injectable()
export class PublicReceiptsService {
  constructor(
    @InjectRepository(Affidavit) private readonly affRepo: Repository<Affidavit>,
    @InjectRepository(Marriage) private readonly marRepo: Repository<Marriage>,
    @InjectRepository(BirthDeathCertificate) private readonly bdRepo: Repository<BirthDeathCertificate>,
    @InjectRepository(PropertyCard) private readonly pcRepo: Repository<PropertyCard>,
    @InjectRepository(ShopActLicense) private readonly salRepo: Repository<ShopActLicense>,
    @InjectRepository(TradeLicenseRecord) private readonly tlRepo: Repository<TradeLicenseRecord>,
    @InjectRepository(PanCardRecord) private readonly panRepo: Repository<PanCardRecord>,
    @InjectRepository(PassportRecord) private readonly passportRepo: Repository<PassportRecord>,
    @InjectRepository(Gazette) private readonly gazetteRepo: Repository<Gazette>,
    @InjectRepository(WaterServiceRecord) private readonly wsRepo: Repository<WaterServiceRecord>,
    @InjectRepository(PropertyTax) private readonly ptRepo: Repository<PropertyTax>,
    @InjectRepository(VoterCardRecord) private readonly voterRepo: Repository<VoterCardRecord>,
  ) {}

  async getReceipt(type: string, id: string): Promise<any> {
    let record: any = null;

    switch (type.toLowerCase()) {
      case 'affidavit':
        record = await this.affRepo.findOne({ where: { id }, relations: ['createdBy', 'customer'] });
        break;
      case 'marriage':
        record = await this.marRepo.findOne({ where: { id }, relations: ['createdBy', 'customer', 'affidavits'] });
        break;
      case 'birth-death':
        record = await this.bdRepo.findOne({ where: { id }, relations: ['createdBy', 'customer'] });
        break;
      case 'property-card':
        record = await this.pcRepo.findOne({ where: { id }, relations: ['createdBy', 'customer'] });
        break;
      case 'shop-act':
        record = await this.salRepo.findOne({ where: { id }, relations: ['createdBy', 'customer'] });
        break;
      case 'trade-license':
        record = await this.tlRepo.findOne({
          where: { id },
          relations: [
            'createdBy',
            'business',
            'business.customers',
            'linkedAffidavit',
            'linkedPropertyCard',
            'linkedShopAct',
          ],
        });
        break;
      case 'pan-card':
        record = await this.panRepo.findOne({ where: { id }, relations: ['createdBy', 'customer'] });
        break;
      case 'passport':
        record = await this.passportRepo.findOne({ where: { id }, relations: ['createdBy', 'customer'] });
        break;
      case 'gazette':
        record = await this.gazetteRepo.findOne({ where: { id }, relations: ['createdBy', 'customer'] });
        break;
      case 'water-supply':
        record = await this.wsRepo.findOne({
          where: { id },
          relations: ['createdBy', 'connection', 'connection.customer', 'payments'],
        });
        break;
      case 'property-tax':
        record = await this.ptRepo.findOne({ where: { id }, relations: ['createdBy', 'customer'] });
        break;
      case 'voter-card':
        record = await this.voterRepo.findOne({ where: { id }, relations: ['createdBy', 'customer'] });
        break;
      default:
        throw new NotFoundException(`Invalid receipt type: ${type}`);
    }

    if (!record) {
      throw new NotFoundException(`Receipt of type ${type} with ID ${id} not found`);
    }

    return record;
  }
}
