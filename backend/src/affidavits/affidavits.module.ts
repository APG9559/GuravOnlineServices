import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Affidavit } from './affidavit.entity';
import { AffidavitsService } from './affidavits.service';
import { AffidavitsController } from './affidavits.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Affidavit])],
  providers: [AffidavitsService],
  controllers: [AffidavitsController],
  exports: [AffidavitsService],
})
export class AffidavitsModule {}
