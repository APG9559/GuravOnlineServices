import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyCard } from './property-card.entity';
import { PropertyCardsService } from './property-cards.service';
import { PropertyCardsController } from './property-cards.controller';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [TypeOrmModule.forFeature([PropertyCard]), CustomersModule],
  providers: [PropertyCardsService],
  controllers: [PropertyCardsController],
  exports: [PropertyCardsService],
})
export class PropertyCardsModule {}
