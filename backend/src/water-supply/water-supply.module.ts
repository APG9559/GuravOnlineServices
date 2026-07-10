import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaterConnection } from './water-connection.entity';
import { WaterServiceRecord } from './water-service-record.entity';
import { WaterPayment } from './water-payment.entity';
import { WaterFeeConfig } from './water-fee-config.entity';
import { WaterDocument } from './water-document.entity';
import { WaterSupplyService } from './water-supply.service';
import { WaterSupplyController } from './water-supply.controller';
import { CustomersModule } from '../customers/customers.module';

import { WaterSupplyReferenceProvider } from './water-supply-reference.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WaterConnection,
      WaterServiceRecord,
      WaterPayment,
      WaterFeeConfig,
      WaterDocument,
    ]),
    CustomersModule,
  ],
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
