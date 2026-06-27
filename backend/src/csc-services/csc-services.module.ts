import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PanCardRecord } from './pan-card.entity';
import { PassportRecord } from './passport.entity';
import { VoterCardRecord } from './voter-card.entity';
import { CscServicesController } from './csc-services.controller';
import { CustomersModule } from '../customers/customers.module';
import { PanCardsService } from './pan-cards.service';
import { PassportsService } from './passports.service';
import { VoterCardsService } from './voter-cards.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PanCardRecord,
      PassportRecord,
      VoterCardRecord,
    ]),
    CustomersModule,
  ],
  providers: [
    PanCardsService,
    PassportsService,
    VoterCardsService,
  ],
  controllers: [CscServicesController],
  exports: [PanCardsService, PassportsService, VoterCardsService, TypeOrmModule],
})
export class CscServicesModule {}
