import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicReceiptsService } from './public-receipts.service';
import { PublicReceiptsController } from './public-receipts.controller';
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
import { PropertyTaxRecord } from '../property-tax/property-tax-record.entity';
import { VoterCardRecord } from '../csc-services/voter-card.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Affidavit,
      Marriage,
      BirthDeathCertificate,
      PropertyCard,
      ShopActLicense,
      TradeLicenseRecord,
      PanCardRecord,
      PassportRecord,
      Gazette,
      WaterServiceRecord,
      PropertyTaxRecord,
      VoterCardRecord,
    ]),
  ],
  providers: [PublicReceiptsService],
  controllers: [PublicReceiptsController],
})
export class PublicReceiptsModule {}
