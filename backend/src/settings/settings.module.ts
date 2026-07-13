import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PricingSetting } from './pricing-setting.entity';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { SyncService } from './sync.service';
import { SyncHandlerRegistry } from './sync-handler.registry';
import { User } from '../users/user.entity';
import { Passkey } from '../auth/passkey.entity';
import { Customer } from '../customers/customer.entity';
import { ActivityLog } from '../activity-logs/activity-log.entity';
import { Expense } from '../expenses/expense.entity';
import { MessageLog } from '../message-logs/message-log.entity';
import { Affidavit } from '../affidavits/affidavit.entity';
import { Marriage } from '../marriages/marriage.entity';
import { MarriageTicket } from '../marriages/marriage-ticket.entity';
import { MarriagePayment } from '../marriages/marriage-payment.entity';
import { BirthDeathCertificate } from '../birth-death-certificates/birth-death-certificate.entity';
import { PropertyCard } from '../property-cards/property-card.entity';
import { ShopActLicense } from '../shop-act-licenses/shop-act-license.entity';
import { Property } from '../property-tax/property.entity';
import { PropertyTaxRecord } from '../property-tax/property-tax-record.entity';
import { PropertyTaxPayment } from '../property-tax/property-tax-payment.entity';
import { PropertyTaxFeeConfig } from '../property-tax/property-tax-fee-config.entity';
import { Business } from '../trade-licenses/business.entity';
import { BusinessTrade } from '../trade-licenses/business-trade.entity';
import { TradeTypeConfig } from '../trade-licenses/trade-type-config.entity';
import { TradeLicenseRecord } from '../trade-licenses/trade-license-record.entity';
import { TradeLicensePayment } from '../trade-licenses/trade-license-payment.entity';
import { PanCardRecord } from '../csc-services/pan-card.entity';
import { PassportRecord } from '../csc-services/passport.entity';
import { VoterCardRecord } from '../csc-services/voter-card.entity';
import { Gazette } from '../gazettes/gazette.entity';
import { WaterConnection } from '../water-supply/water-connection.entity';
import { WaterServiceRecord } from '../water-supply/water-service-record.entity';
import { WaterPayment } from '../water-supply/water-payment.entity';
import { WaterDocument } from '../water-supply/water-document.entity';
import { WaterFeeConfig } from '../water-supply/water-fee-config.entity';
import { MessageTemplate } from '../message-templates/message-template.entity';

const ALL_ENTITIES = [
  PricingSetting, User, Passkey, Customer, ActivityLog, Expense, MessageLog, MessageTemplate,
  Affidavit, Marriage, MarriageTicket, MarriagePayment,
  BirthDeathCertificate, PropertyCard, ShopActLicense, Property, PropertyTaxRecord, PropertyTaxPayment, PropertyTaxFeeConfig,
  Business, BusinessTrade, TradeTypeConfig, TradeLicenseRecord, TradeLicensePayment,
  PanCardRecord, PassportRecord, VoterCardRecord, Gazette,
  WaterConnection, WaterServiceRecord, WaterPayment, WaterDocument, WaterFeeConfig,
];

@Module({
  imports: [TypeOrmModule.forFeature(ALL_ENTITIES)],
  providers: [SettingsService, SyncService, SyncHandlerRegistry],
  controllers: [SettingsController],
  exports: [SettingsService],
})
export class SettingsModule {}
