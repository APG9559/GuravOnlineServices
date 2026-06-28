import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PricingSetting } from '../settings/pricing-setting.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

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
import { ExpensesModule } from '../expenses/expenses.module';

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
import { ExpensesService } from '../expenses/expenses.service';
import { DASHBOARD_METRICS_PROVIDER } from '../common/interfaces/service-metrics.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([PricingSetting]),
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
    ExpensesModule,
  ],
  providers: [
    DashboardService,
    {
      provide: DASHBOARD_METRICS_PROVIDER,
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
        ExpensesService,
      ],
    },
  ],
  controllers: [DashboardController],
})
export class DashboardModule {}
