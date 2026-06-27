import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './customer.entity';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';

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

import { AffidavitsService } from '../affidavits/affidavits.service';
import { MarriagesService } from '../marriages/marriages.service';
import { BirthDeathCertificatesService } from '../birth-death-certificates/birth-death-certificates.service';
import { PropertyCardsService } from '../property-cards/property-cards.service';
import { ShopActLicensesService } from '../shop-act-licenses/shop-act-licenses.service';
import { TradeLicensesService } from '../trade-licenses/trade-licenses.service';
import { PanCardsService } from '../csc-services/pan-cards.service';
import { PassportsService } from '../csc-services/passports.service';
import { VoterCardsService } from '../csc-services/voter-cards.service';
import { GazettesService } from '../gazettes/gazettes.service';
import { WaterSupplyService } from '../water-supply/water-supply.service';
import { PropertyTaxService } from '../property-tax/property-tax.service';
import { CUSTOMER_HISTORY_PROVIDER } from '../common/interfaces/customer-history.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer]),
    forwardRef(() => AffidavitsModule),
    forwardRef(() => MarriagesModule),
    forwardRef(() => BirthDeathCertificatesModule),
    forwardRef(() => PropertyCardsModule),
    forwardRef(() => ShopActLicensesModule),
    forwardRef(() => TradeLicensesModule),
    forwardRef(() => CscServicesModule),
    forwardRef(() => GazettesModule),
    forwardRef(() => WaterSupplyModule),
    forwardRef(() => PropertyTaxModule),
  ],
  providers: [
    CustomersService,
    {
      provide: CUSTOMER_HISTORY_PROVIDER,
      useFactory: (...services) => services,
      inject: [
        AffidavitsService,
        MarriagesService,
        BirthDeathCertificatesService,
        PropertyCardsService,
        ShopActLicensesService,
        TradeLicensesService,
        PanCardsService,
        PassportsService,
        VoterCardsService,
        GazettesService,
        WaterSupplyService,
        PropertyTaxService,
      ],
    },
  ],
  controllers: [CustomersController],
  exports: [CustomersService],
})
export class CustomersModule {}
