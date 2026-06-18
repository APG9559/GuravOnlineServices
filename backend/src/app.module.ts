import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AffidavitsModule } from './affidavits/affidavits.module';
import { MarriagesModule } from './marriages/marriages.module';
import { BirthDeathCertificatesModule } from './birth-death-certificates/birth-death-certificates.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SettingsModule } from './settings/settings.module';
import { User } from './users/user.entity';
import { Affidavit } from './affidavits/affidavit.entity';
import { Marriage } from './marriages/marriage.entity';
import { BirthDeathCertificate } from './birth-death-certificates/birth-death-certificate.entity';
import { PricingSetting } from './settings/pricing-setting.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'familystore',
      entities: [User, Affidavit, Marriage, BirthDeathCertificate, PricingSetting],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    AuthModule,
    UsersModule,
    AffidavitsModule,
    MarriagesModule,
    BirthDeathCertificatesModule,
    DashboardModule,
    SettingsModule,
  ],
})
export class AppModule { }
