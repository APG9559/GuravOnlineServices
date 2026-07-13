import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property } from './property.entity';
import { PropertyTaxRecord } from './property-tax-record.entity';
import { PropertyTaxPayment } from './property-tax-payment.entity';
import { PropertyTaxFeeConfig } from './property-tax-fee-config.entity';
import { PropertyTaxService } from './property-tax.service';
import { PropertyTaxController } from './property-tax.controller';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Property, PropertyTaxRecord, PropertyTaxPayment, PropertyTaxFeeConfig]),
    CustomersModule,
  ],
  providers: [PropertyTaxService],
  controllers: [PropertyTaxController],
  exports: [PropertyTaxService],
})
export class PropertyTaxModule {}
