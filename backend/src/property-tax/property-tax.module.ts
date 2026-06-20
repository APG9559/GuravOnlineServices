import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyTax } from './property-tax.entity';
import { PropertyTaxService } from './property-tax.service';
import { PropertyTaxController } from './property-tax.controller';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [TypeOrmModule.forFeature([PropertyTax]), CustomersModule],
  providers: [PropertyTaxService],
  controllers: [PropertyTaxController],
  exports: [PropertyTaxService],
})
export class PropertyTaxModule {}
