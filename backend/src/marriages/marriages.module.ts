import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Marriage } from './marriage.entity';
import { MarriageTicket } from './marriage-ticket.entity';
import { MarriagePayment } from './marriage-payment.entity';
import { Affidavit } from '../affidavits/affidavit.entity';
import { MarriagesService } from './marriages.service';
import { MarriagesController } from './marriages.controller';
import { CustomersModule } from '../customers/customers.module';
import { MarriageReferenceProvider } from './marriage-reference.provider';

@Module({
  imports: [TypeOrmModule.forFeature([Marriage, MarriageTicket, MarriagePayment, Affidavit]), CustomersModule],
  providers: [
    MarriagesService,
    {
      provide: 'ReferenceProvider',
      useClass: MarriageReferenceProvider,
    },
  ],
  controllers: [MarriagesController],
  exports: [MarriagesService, 'ReferenceProvider'],
})
export class MarriagesModule {}
