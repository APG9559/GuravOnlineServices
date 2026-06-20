import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PanCardRecord } from './pan-card.entity';
import { PassportRecord } from './passport.entity';
import { VoterCardRecord } from './voter-card.entity';
import { CscServicesService } from './csc-services.service';
import { CscServicesController } from './csc-services.controller';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PanCardRecord,
      PassportRecord,
      VoterCardRecord,
    ]),
    CustomersModule,
  ],
  providers: [CscServicesService],
  controllers: [CscServicesController],
  exports: [CscServicesService, TypeOrmModule],
})
export class CscServicesModule {}
