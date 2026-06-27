import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { AffidavitsModule } from '../affidavits/affidavits.module';
import { MarriagesModule } from '../marriages/marriages.module';
import { BirthDeathCertificatesModule } from '../birth-death-certificates/birth-death-certificates.module';
import { PropertyCardsModule } from '../property-cards/property-cards.module';
import { ShopActLicensesModule } from '../shop-act-licenses/shop-act-licenses.module';
import { TradeLicensesModule } from '../trade-licenses/trade-licenses.module';
import { CscServicesModule } from '../csc-services/csc-services.module';
import { GazettesModule } from '../gazettes/gazettes.module';
import { WaterSupplyModule } from '../water-supply/water-supply.module';
import { PropertyTaxModule } from '../property-tax/property-tax.module';

import { CustomerHistoryService } from './customer-history.service';
import { CustomersController } from '../customers/customers.controller';

@Module({
  imports: [
    CustomersModule,
    AffidavitsModule,
    MarriagesModule,
    BirthDeathCertificatesModule,
    PropertyCardsModule,
    ShopActLicensesModule,
    TradeLicensesModule,
    CscServicesModule,
    GazettesModule,
    WaterSupplyModule,
    PropertyTaxModule,
  ],
  providers: [CustomerHistoryService],
  controllers: [CustomersController],
  exports: [CustomerHistoryService],
})
export class CustomerHistoryModule {}
