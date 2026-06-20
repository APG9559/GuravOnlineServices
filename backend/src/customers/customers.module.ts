import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './customer.entity';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { Affidavit } from '../affidavits/affidavit.entity';
import { Marriage } from '../marriages/marriage.entity';
import { BirthDeathCertificate } from '../birth-death-certificates/birth-death-certificate.entity';
import { PropertyCard } from '../property-cards/property-card.entity';
import { ShopActLicense } from '../shop-act-licenses/shop-act-license.entity';
import { TradeLicenseRecord } from '../trade-licenses/trade-license-record.entity';
import { Gazette } from '../gazettes/gazette.entity';
import { PanCardRecord } from '../csc-services/pan-card.entity';
import { PassportRecord } from '../csc-services/passport.entity';
import { VoterCardRecord } from '../csc-services/voter-card.entity';
import { WaterSupply } from '../water-supply/water-supply.entity';
import { PropertyTax } from '../property-tax/property-tax.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      Affidavit,
      Marriage,
      BirthDeathCertificate,
      PropertyCard,
      ShopActLicense,
      TradeLicenseRecord,
      Gazette,
      PanCardRecord,
      PassportRecord,
      VoterCardRecord,
      WaterSupply,
      PropertyTax,
    ]),
  ],
  providers: [CustomersService],
  controllers: [CustomersController],
  exports: [CustomersService],
})
export class CustomersModule {}
