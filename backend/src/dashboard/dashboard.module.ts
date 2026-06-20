import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([
    Affidavit, Marriage, BirthDeathCertificate, PropertyCard, ShopActLicense, PricingSetting, TradeLicenseRecord,
    PanCardRecord, PassportRecord, Gazette, WaterSupply, PropertyTax, VoterCardRecord
  ])],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule { }
