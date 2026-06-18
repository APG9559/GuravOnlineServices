import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BirthDeathCertificate } from './birth-death-certificate.entity';
import { BirthDeathCertificatesService } from './birth-death-certificates.service';
import { BirthDeathCertificatesController } from './birth-death-certificates.controller';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [TypeOrmModule.forFeature([BirthDeathCertificate]), CustomersModule],
  providers: [BirthDeathCertificatesService],
  controllers: [BirthDeathCertificatesController],
  exports: [BirthDeathCertificatesService],
})
export class BirthDeathCertificatesModule {}
