import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from './business.entity';
import { TradeLicenseRecord } from './trade-license-record.entity';
import { TradeLicensePayment } from './trade-license-payment.entity';
import { TradeTypeConfig } from './trade-type-config.entity';
import { Customer } from '../customers/customer.entity';
import { Affidavit } from '../affidavits/affidavit.entity';
import { PropertyCard } from '../property-cards/property-card.entity';
import { ShopActLicense } from '../shop-act-licenses/shop-act-license.entity';
import { TradeLicensesController } from './trade-licenses.controller';
import { TradeLicensesService } from './trade-licenses.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Business,
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
  ],
  exports: [TradeLicensesService, TypeOrmModule],
})
export class TradeLicensesModule {}
