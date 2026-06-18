import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Marriage } from './marriage.entity';
import { MarriageTicket } from './marriage-ticket.entity';
import { Affidavit } from '../affidavits/affidavit.entity';
import { MarriagesService } from './marriages.service';
import { MarriagesController } from './marriages.controller';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [TypeOrmModule.forFeature([Marriage, MarriageTicket, Affidavit]), CustomersModule],
  providers: [MarriagesService],
  controllers: [MarriagesController],
  exports: [MarriagesService],
})
export class MarriagesModule {}
