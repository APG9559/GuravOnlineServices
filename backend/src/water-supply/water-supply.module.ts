import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaterSupply } from './water-supply.entity';
import { WaterSupplyService } from './water-supply.service';
import { WaterSupplyController } from './water-supply.controller';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [TypeOrmModule.forFeature([WaterSupply]), CustomersModule],
  providers: [WaterSupplyService],
  controllers: [WaterSupplyController],
  exports: [WaterSupplyService],
})
export class WaterSupplyModule {}
