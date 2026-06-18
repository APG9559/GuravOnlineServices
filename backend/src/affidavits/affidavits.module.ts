import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Affidavit } from './affidavit.entity';
import { AffidavitsService } from './affidavits.service';
import { AffidavitsController } from './affidavits.controller';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [TypeOrmModule.forFeature([Affidavit]), CustomersModule],
  providers: [AffidavitsService],
  controllers: [AffidavitsController],
  exports: [AffidavitsService],
})
export class AffidavitsModule {}
