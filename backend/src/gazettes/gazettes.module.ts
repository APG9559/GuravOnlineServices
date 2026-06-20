import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gazette } from './gazette.entity';
import { GazettesService } from './gazettes.service';
import { GazettesController } from './gazettes.controller';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [TypeOrmModule.forFeature([Gazette]), CustomersModule],
  providers: [GazettesService],
  controllers: [GazettesController],
  exports: [GazettesService],
})
export class GazettesModule {}
