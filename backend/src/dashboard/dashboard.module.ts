import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Affidavit } from '../affidavits/affidavit.entity';
import { Marriage } from '../marriages/marriage.entity';
import { BirthDeathCertificate } from '../birth-death-certificates/birth-death-certificate.entity';
import { PricingSetting } from '../settings/pricing-setting.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Affidavit, Marriage, BirthDeathCertificate, PricingSetting])],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
