import { Module } from '@nestjs/common';
import { ReferencesController } from './references.controller';
import { ReferencesService } from './references.service';
import { MarriagesModule } from '../marriages/marriages.module';
import { TradeLicensesModule } from '../trade-licenses/trade-licenses.module';
import { WaterSupplyModule } from '../water-supply/water-supply.module';
import { MarriageReferenceProvider } from '../marriages/marriage-reference.provider';
import { TradeLicenseReferenceProvider } from '../trade-licenses/trade-license-reference.provider';
import { WaterSupplyReferenceProvider } from '../water-supply/water-supply-reference.provider';
import { ReferenceProvider } from './interfaces/reference-provider.interface';

@Module({
  imports: [MarriagesModule, TradeLicensesModule, WaterSupplyModule],
  controllers: [ReferencesController],
  providers: [
    ReferencesService,
    {
      provide: 'ReferenceProvider',
      useFactory: (
        marriages: MarriageReferenceProvider,
        trade: TradeLicenseReferenceProvider,
        water: WaterSupplyReferenceProvider,
      ): ReferenceProvider[] => [marriages, trade, water],
      inject: [MarriageReferenceProvider, TradeLicenseReferenceProvider, WaterSupplyReferenceProvider],
    },
  ],
  exports: [ReferencesService],
})
export class ReferencesModule {}
