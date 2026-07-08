import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaterSupply } from './water-supply.entity';
import { WaterSupplyService } from './water-supply.service';
import { WaterSupplyController } from './water-supply.controller';
import { CustomersModule } from '../customers/customers.module';

import { WaterSupplyReferenceProvider } from './water-supply-reference.provider';

@Module({
  imports: [TypeOrmModule.forFeature([WaterSupply]), CustomersModule],
  providers: [
    WaterSupplyService,
    {
      provide: 'ReferenceProvider',
      useClass: WaterSupplyReferenceProvider,
    },
  ],
  controllers: [WaterSupplyController],
  exports: [WaterSupplyService, 'ReferenceProvider'],
})
export class WaterSupplyModule {}
