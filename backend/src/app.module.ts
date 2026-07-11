import { Module, OnApplicationBootstrap } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { AffidavitsModule } from "./affidavits/affidavits.module";
import { MarriagesModule } from "./marriages/marriages.module";
import { BirthDeathCertificatesModule } from "./birth-death-certificates/birth-death-certificates.module";
import { PropertyCardsModule } from "./property-cards/property-cards.module";
import { ShopActLicensesModule } from "./shop-act-licenses/shop-act-licenses.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { SettingsModule } from "./settings/settings.module";
import { CustomersModule } from "./customers/customers.module";
import { CustomerHistoryModule } from "./customer-history/customer-history.module";
import { TradeLicensesModule } from "./trade-licenses/trade-licenses.module";
import { CscServicesModule } from "./csc-services/csc-services.module";
import { GazettesModule } from "./gazettes/gazettes.module";
import { WaterSupplyModule } from "./water-supply/water-supply.module";
import { PropertyTaxModule } from "./property-tax/property-tax.module";
import { ExpensesModule } from "./expenses/expenses.module";
import { ActivityLogModule } from "./activity-logs/activity-log.module";
import { AuditLogInterceptor } from "./activity-logs/audit-log.interceptor";
import { PublicReceiptsModule } from "./public-receipts/public-receipts.module";
import { ReferencesModule } from "./references/references.module";
import { MessageLogsModule } from "./message-logs/message-log.module";
import { MessageTemplatesModule } from "./message-templates/message-templates.module";
// import { User } from './users/user.entity';
// import { Affidavit } from './affidavits/affidavit.entity';
// import { Marriage } from './marriages/marriage.entity';
// import { MarriageTicket } from './marriages/marriage-ticket.entity';
// import { BirthDeathCertificate } from './birth-death-certificates/birth-death-certificate.entity';
// import { TradeTypeConfig } from './trade-licenses/trade-type-config.entity';
// import { PricingSetting } from './settings/pricing-setting.entity';
// import { WaterSupply } from './water-supply/water-supply.entity';
// import { Customer } from './customers/customer.entity';
// import { PropertyCard } from './property-cards/property-card.entity';
// import { ShopActLicense } from './shop-act-licenses/shop-act-license.entity';
// import { Business } from './trade-licenses/business.entity';
// import { TradeLicenseRecord } from './trade-licenses/trade-license-record.entity';
// import { PanCardRecord } from './csc-services/pan-card.entity';
// import { PassportRecord } from './csc-services/passport.entity';
// import { Gazette } from './gazettes/gazette.entity';
// import { PropertyTax } from './property-tax/property-tax.entity';
// import { VoterCardRecord } from './csc-services/voter-card.entity';
// import { Expense } from './expenses/expense.entity';
// import { ActivityLog } from './activity-logs/activity-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([]), // (Empty check or just default to forRoot below)
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      username: process.env.DB_USERNAME || "postgres",
      password: process.env.DB_PASSWORD || "root",
      database: process.env.DB_NAME || "familystore",
      autoLoadEntities: true,
      synchronize: true,
      ssl:
        process.env.DB_HOST?.includes("neon.tech") ||
        process.env.DB_SSL === "true"
          ? { rejectUnauthorized: false }
          : false,
      logging:
        process.env.DB_LOGGING === "true"
          ? true
          : process.env.NODE_ENV === "production"
            ? ["error"]
            : ["error", "warn"],
      extra: {
        max: parseInt(process.env.DB_POOL_MAX || "20", 10),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      },
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
    CustomerHistoryModule,
    TradeLicensesModule,
    CscServicesModule,
    GazettesModule,
    WaterSupplyModule,
    PropertyTaxModule,
    ExpensesModule,
    ActivityLogModule,
    PublicReceiptsModule,
    ReferencesModule,
    MessageLogsModule,
    MessageTemplatesModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap() {
    console.log("⚡ Running database cleanliness routines...");
    try {
      // Clean up split array items in the marriage table
      await this.dataSource.query(`
        UPDATE marriages 
        SET "servicesProvided" = REPLACE("servicesProvided", 'Misc (Form,Xerox Copies)', 'Misc (Form - Xerox Copies)')
        WHERE "servicesProvided" LIKE '%Misc (Form,Xerox Copies)%';
      `);

      await this.dataSource.query(`
        UPDATE marriages 
        SET "servicesProvided" = REPLACE("servicesProvided", 'Misc (Form, Xerox Copies)', 'Misc (Form - Xerox Copies)')
        WHERE "servicesProvided" LIKE '%Misc (Form, Xerox Copies)%';
      `);

      // Clean up split array items in the marriage_ticket table
      await this.dataSource.query(`
        UPDATE marriage_tickets 
        SET "servicesProvided" = REPLACE("servicesProvided", 'Misc (Form,Xerox Copies)', 'Misc (Form - Xerox Copies)')
        WHERE "servicesProvided" LIKE '%Misc (Form,Xerox Copies)%';
      `);

      await this.dataSource.query(`
        UPDATE marriage_tickets 
        SET "servicesProvided" = REPLACE("servicesProvided", 'Misc (Form, Xerox Copies)', 'Misc (Form - Xerox Copies)')
        WHERE "servicesProvided" LIKE '%Misc (Form, Xerox Copies)%';
      `);

      console.log("✅ Database cleanliness routines completed.");
    } catch (error) {
      console.error("❌ Failed to run database cleanliness routines:", error);
    }
  }
}
