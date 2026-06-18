import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Marriage } from './marriage.entity';
import { Affidavit } from '../affidavits/affidavit.entity';
import { MarriagesService } from './marriages.service';
import { MarriagesController } from './marriages.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Marriage, Affidavit])],
  providers: [MarriagesService],
  controllers: [MarriagesController],
  exports: [MarriagesService],
})
export class MarriagesModule {}
