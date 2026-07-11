import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from './business.entity';
import { BusinessTrade } from './business-trade.entity';
import { TradeLicenseRecord } from './trade-license-record.entity';
import { TradeLicensePayment } from './trade-license-payment.entity';
import { TradeTypeConfig } from './trade-type-config.entity';
import { Customer } from '../customers/customer.entity';
import { Affidavit } from '../affidavits/affidavit.entity';
import { PropertyCard } from '../property-cards/property-card.entity';
import { ShopActLicense } from '../shop-act-licenses/shop-act-license.entity';
import { TradeLicensesController } from './trade-licenses.controller';
import { TradeLicensesService } from './trade-licenses.service';

import { TradeLicenseReferenceProvider } from './trade-license-reference.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Business,
      BusinessTrade,
      TradeLicenseRecord,
      TradeLicensePayment,
      TradeTypeConfig,
      Customer,
      Affidavit,
      PropertyCard,
      ShopActLicense,
    ]),
  ],
  controllers: [TradeLicensesController],
  providers: [
    TradeLicensesService,
    TradeLicenseReferenceProvider,
  ],
  exports: [TradeLicensesService, TradeLicenseReferenceProvider, TypeOrmModule],
})
export class TradeLicensesModule {}

