import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AffidavitsModule } from './affidavits/affidavits.module';
import { MarriagesModule } from './marriages/marriages.module';
import { BirthDeathCertificatesModule } from './birth-death-certificates/birth-death-certificates.module';
import { PropertyCardsModule } from './property-cards/property-cards.module';
import { ShopActLicensesModule } from './shop-act-licenses/shop-act-licenses.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SettingsModule } from './settings/settings.module';
import { User } from './users/user.entity';
import { Affidavit } from './affidavits/affidavit.entity';
import { Marriage } from './marriages/marriage.entity';
import { MarriageTicket } from './marriages/marriage-ticket.entity';
import { BirthDeathCertificate } from './birth-death-certificates/birth-death-certificate.entity';
import { PropertyCard } from './property-cards/property-card.entity';
import { ShopActLicense } from './shop-act-licenses/shop-act-license.entity';
import { PricingSetting } from './settings/pricing-setting.entity';
import { Customer } from './customers/customer.entity';
import { CustomersModule } from './customers/customers.module';
import { Business } from './trade-licenses/business.entity';
import { TradeLicenseRecord } from './trade-licenses/trade-license-record.entity';
import { TradeTypeConfig } from './trade-licenses/trade-type-config.entity';
import { TradeLicensesModule } from './trade-licenses/trade-licenses.module';
import { PanCardRecord } from './csc-services/pan-card.entity';
import { PassportRecord } from './csc-services/passport.entity';
import { CscServicesModule } from './csc-services/csc-services.module';
import { Gazette } from './gazettes/gazette.entity';
import { GazettesModule } from './gazettes/gazettes.module';
import { WaterSupply } from './water-supply/water-supply.entity';
import { WaterSupplyModule } from './water-supply/water-supply.module';
import { PropertyTax } from './property-tax/property-tax.entity';
import { PropertyTaxModule } from './property-tax/property-tax.module';
import { VoterCardRecord } from './csc-services/voter-card.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([]), // (Empty check or just default to forRoot below)
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'familystore',
      entities: [
        User, Affidavit, Marriage, MarriageTicket,
        BirthDeathCertificate, PropertyCard, ShopActLicense,
        PricingSetting, Customer, Business, TradeLicenseRecord,
        TradeTypeConfig, PanCardRecord, PassportRecord, Gazette,
        WaterSupply, PropertyTax, VoterCardRecord
      ],
      synchronize: process.env.NODE_ENV !== 'production',
      // logging: process.env.NODE_ENV === 'development',
    }),
    AuthModule,
    UsersModule,
    AffidavitsModule,
    MarriagesModule,
    BirthDeathCertificatesModule,
    PropertyCardsModule,
    ShopActLicensesModule,
    DashboardModule,
    SettingsModule,
    CustomersModule,
    TradeLicensesModule,
    CscServicesModule,
    GazettesModule,
    WaterSupplyModule,
    PropertyTaxModule,
  ],
})
export class AppModule { }
