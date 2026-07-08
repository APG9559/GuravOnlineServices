import { Module } from '@nestjs/common';
import { ReferencesController } from './references.controller';
import { ReferencesService } from './references.service';
import { MarriagesModule } from '../marriages/marriages.module';
import { TradeLicensesModule } from '../trade-licenses/trade-licenses.module';
import { WaterSupplyModule } from '../water-supply/water-supply.module';

@Module({
  imports: [MarriagesModule, TradeLicensesModule, WaterSupplyModule],
  controllers: [ReferencesController],
  providers: [ReferencesService],
  exports: [ReferencesService],
})
export class ReferencesModule {}
