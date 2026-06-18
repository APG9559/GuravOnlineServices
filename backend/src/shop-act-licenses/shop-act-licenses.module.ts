import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopActLicense } from './shop-act-license.entity';
import { ShopActLicensesService } from './shop-act-licenses.service';
import { ShopActLicensesController } from './shop-act-licenses.controller';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [TypeOrmModule.forFeature([ShopActLicense]), CustomersModule],
  providers: [ShopActLicensesService],
  controllers: [ShopActLicensesController],
  exports: [ShopActLicensesService],
})
export class ShopActLicensesModule {}
