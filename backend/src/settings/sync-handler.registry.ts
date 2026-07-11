import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, In } from 'typeorm';
import { User } from '../users/user.entity';
import { Customer } from '../customers/customer.entity';
import { Passkey } from '../auth/passkey.entity';
import { ActivityLog } from '../activity-logs/activity-log.entity';
import { Expense } from '../expenses/expense.entity';
import { PricingSetting } from '../settings/pricing-setting.entity';
import { MessageLog } from '../message-logs/message-log.entity';
import { Affidavit } from '../affidavits/affidavit.entity';
import { Marriage } from '../marriages/marriage.entity';
import { MarriageTicket } from '../marriages/marriage-ticket.entity';
import { MarriagePayment } from '../marriages/marriage-payment.entity';
import { BirthDeathCertificate } from '../birth-death-certificates/birth-death-certificate.entity';
import { PropertyCard } from '../property-cards/property-card.entity';
import { ShopActLicense } from '../shop-act-licenses/shop-act-license.entity';
import { PropertyTax } from '../property-tax/property-tax.entity';
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
import {
  ALL_SYNC_TABLES,
  BUSINESS_KEYS,
  IMPORT_ORDER,
  SyncMeta,
  SyncPreviewRow,
  SyncPreviewResult,
  SyncImportResult,
} from './sync-types';

// ── Context ──────────────────────────────────────────────────────────────────

export interface ImportContext {
  manager: EntityManager;
  userEmailMap: Map<string, string>;   // email → user UUID (existing + imported)
  userUuidMap: Map<string, string>;    // old UUID → resolved UUID (for FK remap)
  customerPhoneMap: Map<string, string>; // phone → customer UUID
  customerUuidMap: Map<string, string>;
  entityUuidMaps: Map<string, Map<string, string>>; // tableName → oldUUID → resolvedUUID
  errors: string[];
  stats: Map<string, { inserted: number; skipped: number }>;
}

// ── Handler Interface ────────────────────────────────────────────────────────

export interface EntitySyncHandler<TRecord = any, TEntity = any> {
  tableName: string;
  primaryKey?: string;
  softDelete?: boolean;
  exportRelations: string[];
  toSyncRecord(entity: TEntity): TRecord;
  fromSyncRecord(record: TRecord, ctx: ImportContext): Promise<Record<string, any>>;
  previewOne?(record: TRecord, ctx: ImportContext): Promise<boolean>;
}

// ── Resolver Helpers ─────────────────────────────────────────────────────────

function getMeta(record: any): SyncMeta {
  return record._meta ?? {};
}

/**
 * Resolve a createdBy user reference.
 * Strategy:
 *   1. Try record.createdBy (UUID) → look up in existing session map
 *   2. Fall back to _meta.createdByEmail → look up existing user
 *   3. If user with email exists → return its UUID
 *   4. If not → error (users should be imported first)
 */
export async function resolveCreatedBy(
  record: any,
  ctx: ImportContext,
): Promise<string | null> {
  const recordUuid = record.createdBy || record.created_by || record.userId || record.user_id;
  const meta = getMeta(record);

  // If there's a direct UUID, look it up in the session map
  if (recordUuid) {
    const userMap = ctx.entityUuidMaps.get('users');
    if (userMap?.has(recordUuid)) {
      return userMap.get(recordUuid)!;
    }
    // Try direct DB lookup by UUID (existing user)
    const existing = await ctx.manager.findOne(User, { where: { id: recordUuid } as any });
    if (existing) return existing.id;
  }

  // Fall back to email
  const email = meta.createdByEmail;
  if (email) {
    if (ctx.userEmailMap.has(email)) return ctx.userEmailMap.get(email)!;
    const existing = await ctx.manager.findOne(User, { where: { email } } as any);
    if (existing) {
      ctx.userEmailMap.set(email, existing.id);
      return existing.id;
    }
  }

  ctx.errors.push(`User not found for record: ${JSON.stringify(meta)}`);
  return null;
}

/**
 * Resolve a customer reference.
 * Strategy:
 *   1. Try record.customerId (UUID) → look up in session map
 *   2. Fall back to _meta.customerPhone → look up existing
 *   3. If not found, return null (customer is nullable for most entities)
 */
export async function resolveCustomer(
  record: any,
  ctx: ImportContext,
): Promise<string | null> {
  const customerId = record.customerId || record.customer_id;
  const meta = getMeta(record);

  if (customerId) {
    const map = ctx.entityUuidMaps.get('customers');
    if (map?.has(customerId)) return map.get(customerId)!;
    const existing = await ctx.manager.findOne(Customer, { where: { id: customerId } as any });
    if (existing) return existing.id;
  }

  const phone = meta.customerPhone ?? record.phone;
  if (phone) {
    if (ctx.customerPhoneMap.has(phone)) return ctx.customerPhoneMap.get(phone)!;
    const existing = await ctx.manager.findOne(Customer, { where: { phone } } as any);
    if (existing) {
      ctx.customerPhoneMap.set(phone, existing.id);
      return existing.id;
    }
  }

  return null;
}

/**
 * Resolve any FK reference by entity table name.
 */
export async function resolveEntityRef(
  tableName: string,
  uuid: string | null | undefined,
  ctx: ImportContext,
): Promise<string | null | undefined> {
  if (!uuid) return uuid;
  const map = ctx.entityUuidMaps.get(tableName);
  if (map?.has(uuid)) return map.get(uuid)!;
  // Could add DB lookup here for existing entities
  return uuid; // Assume UUID is correct (it was either preserved or remapped)
}

// ── Registry ─────────────────────────────────────────────────────────────────

@Injectable()
export class SyncHandlerRegistry {
  private readonly logger = new Logger(SyncHandlerRegistry.name);
  private readonly handlers = new Map<string, EntitySyncHandler>();

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(Passkey) private passkeyRepo: Repository<Passkey>,
    @InjectRepository(ActivityLog) private activityLogRepo: Repository<ActivityLog>,
    @InjectRepository(Expense) private expenseRepo: Repository<Expense>,
    @InjectRepository(PricingSetting) private pricingSettingRepo: Repository<PricingSetting>,
    @InjectRepository(MessageLog) private messageLogRepo: Repository<MessageLog>,
    @InjectRepository(Affidavit) private affidavitRepo: Repository<Affidavit>,
    @InjectRepository(Marriage) private marriageRepo: Repository<Marriage>,
    @InjectRepository(MarriageTicket) private marriageTicketRepo: Repository<MarriageTicket>,
    @InjectRepository(MarriagePayment) private marriagePaymentRepo: Repository<MarriagePayment>,
    @InjectRepository(BirthDeathCertificate) private bdcRepo: Repository<BirthDeathCertificate>,
    @InjectRepository(PropertyCard) private propertyCardRepo: Repository<PropertyCard>,
    @InjectRepository(ShopActLicense) private shopActRepo: Repository<ShopActLicense>,
    @InjectRepository(PropertyTax) private propertyTaxRepo: Repository<PropertyTax>,
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    @InjectRepository(BusinessTrade) private businessTradeRepo: Repository<BusinessTrade>,
    @InjectRepository(TradeTypeConfig) private tradeTypeConfigRepo: Repository<TradeTypeConfig>,
    @InjectRepository(TradeLicenseRecord) private tradeLicRecordRepo: Repository<TradeLicenseRecord>,
    @InjectRepository(TradeLicensePayment) private tradeLicPaymentRepo: Repository<TradeLicensePayment>,
    @InjectRepository(PanCardRecord) private panCardRepo: Repository<PanCardRecord>,
    @InjectRepository(PassportRecord) private passportRepo: Repository<PassportRecord>,
    @InjectRepository(VoterCardRecord) private voterCardRepo: Repository<VoterCardRecord>,
    @InjectRepository(Gazette) private gazetteRepo: Repository<Gazette>,
    @InjectRepository(WaterConnection) private waterConnRepo: Repository<WaterConnection>,
    @InjectRepository(WaterServiceRecord) private waterSvcRepo: Repository<WaterServiceRecord>,
    @InjectRepository(WaterPayment) private waterPayRepo: Repository<WaterPayment>,
    @InjectRepository(WaterDocument) private waterDocRepo: Repository<WaterDocument>,
    @InjectRepository(WaterFeeConfig) private waterFeeRepo: Repository<WaterFeeConfig>,
  ) {
    this.registerAll();
  }

  // ── Registration ──────────────────────────────────────────────────────────

  private register(tableName: string, handler: EntitySyncHandler) {
    this.handlers.set(tableName, handler);
  }

  private registerAll() {
    this.register('users', this.createUserHandler());
    this.register('passkeys', this.createPasskeyHandler());
    this.register('customers', this.createCustomerHandler());
    this.register('activity_logs', this.createActivityLogHandler());
    this.register('expenses', this.createExpenseHandler());
    this.register('pricing_settings', this.createPricingSettingHandler());
    this.register('message_logs', this.createMessageLogHandler());
    this.register('affidavits', this.createAffidavitHandler());
    this.register('marriages', this.createMarriageHandler());
    this.register('marriage_tickets', this.createMarriageTicketHandler());
    this.register('marriage_payments', this.createMarriagePaymentHandler());
    this.register('birth_death_certificates', this.createBDCHandler());
    this.register('property_cards', this.createPropertyCardHandler());
    this.register('shop_act_licenses', this.createShopActHandler());
    this.register('property_tax_records', this.createPropertyTaxHandler());
    this.register('businesses', this.createBusinessHandler());
    this.register('business_trades', this.createBusinessTradeHandler());
    this.register('trade_type_configs', this.createTradeTypeConfigHandler());
    this.register('trade_license_records', this.createTradeLicenseRecordHandler());
    this.register('trade_license_payments', this.createTradeLicensePaymentHandler());
    this.register('pan_card_records', this.createPanCardHandler());
    this.register('passport_records', this.createPassportHandler());
    this.register('voter_card_records', this.createVoterCardHandler());
    this.register('gazettes', this.createGazetteHandler());
    this.register('water_connections', this.createWaterConnectionHandler());
    this.register('water_service_records', this.createWaterServiceRecordHandler());
    this.register('water_payments', this.createWaterPaymentHandler());
    this.register('water_documents', this.createWaterDocumentHandler());
    this.register('water_fee_configs', this.createWaterFeeConfigHandler());
  }

  getHandler(tableName: string): EntitySyncHandler | undefined {
    return this.handlers.get(tableName);
  }

  hasHandler(tableName: string): boolean {
    return this.handlers.has(tableName);
  }

  getSortedTableNames(requestedTables: string[]): string[] {
    const requested = new Set(requestedTables);
    return IMPORT_ORDER.filter((t) => requested.has(t));
  }

  getAllTableNames(): string[] {
    return [...ALL_SYNC_TABLES];
  }

  // ── Helper: check business key duplicate ──────────────────────────────────

  private async checkBusinessKey<T>(
    repo: Repository<T>,
    record: any,
    ctx: ImportContext,
  ): Promise<boolean> {
    const keys = BUSINESS_KEYS[record._tableName || ''];
    if (!keys || keys.length === 0) return false;
    const where: any = {};
    for (const key of keys) {
      where[key] = record[key];
    }
    const existing = await repo.findOne({ where, withDeleted: false } as any);
    return !!existing;
  }

  // ── User Handler ──────────────────────────────────────────────────────────

  private createUserHandler(): EntitySyncHandler<any, User> {
    return {
      tableName: 'users',
      softDelete: false,
      exportRelations: [],
      toSyncRecord: (u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        passwordHash: u.passwordHash,
        role: u.role,
        isActive: u.isActive,
        isFirstLogin: u.isFirstLogin,
        signature: u.signature,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
        _meta: { businessKey: { email: u.email } },
      }),
      fromSyncRecord: async (r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        passwordHash: r.passwordHash,
        role: r.role,
        isActive: r.isActive,
        isFirstLogin: r.isFirstLogin,
        signature: r.signature,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }),
      previewOne: async (r, ctx) => {
        const byUuid = await ctx.manager.findOne(User, { where: { id: r.id } } as any);
        if (byUuid) return false;
        const byEmail = await ctx.manager.findOne(User, { where: { email: r.email } } as any);
        return !byEmail;
      },
    };
  }

  // ── Passkey Handler ───────────────────────────────────────────────────────

  private createPasskeyHandler(): EntitySyncHandler<any, Passkey> {
    return {
      tableName: 'passkeys',
      softDelete: false,
      exportRelations: [],
      toSyncRecord: (p) => ({
        id: p.id,
        credentialID: p.credentialID,
        publicKey: Buffer.isBuffer(p.publicKey) ? p.publicKey.toString('base64') : p.publicKey,
        counter: p.counter,
        deviceType: p.deviceType,
        backedUp: p.backedUp,
        transports: p.transports,
        userId: p.user?.id || (p as any).userId,
        _meta: {},
      }),
      fromSyncRecord: async (r) => ({
        id: r.id,
        credentialID: r.credentialID,
        publicKey: Buffer.from(r.publicKey, 'base64'),
        counter: r.counter,
        deviceType: r.deviceType,
        backedUp: r.backedUp,
        transports: r.transports,
        userId: r.userId,
      }),
      previewOne: async (r, ctx) => {
        const exists = await ctx.manager.findOne(Passkey, { where: { id: r.id } } as any);
        return !exists;
      },
    };
  }

  // ── Customer Handler ──────────────────────────────────────────────────────

  private createCustomerHandler(): EntitySyncHandler<any, Customer> {
    return {
      tableName: 'customers',
      exportRelations: [],
      toSyncRecord: (c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        address: c.address,
        email: c.email,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        deletedAt: c.deletedAt?.toISOString() ?? null,
        _meta: { businessKey: { phone: c.phone } },
      }),
      fromSyncRecord: async (r) => ({
        id: r.id,
        name: r.name,
        phone: r.phone,
        address: r.address,
        email: r.email,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
      }),
      previewOne: async (r, ctx) => {
        const byUuid = await ctx.manager.findOne(Customer, { where: { id: r.id } } as any);
        if (byUuid) return false;
        if (r.phone) {
          const byPhone = await ctx.manager.findOne(Customer, { where: { phone: r.phone } } as any);
          if (byPhone) return false;
        }
        return true;
      },
    };
  }

  // ── ActivityLog Handler ───────────────────────────────────────────────────

  private createActivityLogHandler(): EntitySyncHandler<any, ActivityLog> {
    return {
      tableName: 'activity_logs',
      softDelete: false,
      exportRelations: [],
      toSyncRecord: (e) => ({
        id: e.id,
        action: e.action,
        module: e.module,
        recordId: e.recordId,
        details: e.details,
        userId: e.user?.id ?? (e as any).userId ?? null,
        createdAt: e.createdAt.toISOString(),
        _meta: { createdByEmail: e.user?.email },
      }),
      fromSyncRecord: async (r, ctx) => ({
        id: r.id,
        action: r.action,
        module: r.module,
        recordId: r.recordId,
        details: r.details,
        userId: r.userId ? await resolveEntityRef('users', r.userId, ctx) : null,
        createdAt: r.createdAt,
      }),
      previewOne: async (r, ctx) => {
        const exists = await ctx.manager.findOne(ActivityLog, { where: { id: r.id } } as any);
        return !exists;
      },
    };
  }

  // ── Expense Handler ──────────────────────────────────────────────────────

  private createExpenseHandler(): EntitySyncHandler<any, Expense> {
    return {
      tableName: 'expenses',
      softDelete: false,
      exportRelations: [],
      toSyncRecord: (e) => ({
        id: e.id,
        category: e.category,
        type: e.type,
        description: e.description,
        amount: Number(e.amount),
        date: e.date,
        userId: e.user?.id ?? (e as any).userId,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
        _meta: { createdByEmail: e.user?.email },
      }),
      fromSyncRecord: async (r, ctx) => ({
        id: r.id,
        category: r.category,
        type: r.type,
        description: r.description,
        amount: r.amount,
        date: r.date,
        userId: r.userId ? await resolveEntityRef('users', r.userId, ctx) : null,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }),
      previewOne: async (r, ctx) => {
        const exists = await ctx.manager.findOne(Expense, { where: { id: r.id } } as any);
        return !exists;
      },
    };
  }

  // ── PricingSetting Handler ───────────────────────────────────────────────

  private createPricingSettingHandler(): EntitySyncHandler<any, PricingSetting> {
    return {
      tableName: 'pricing_settings',
      primaryKey: 'key',
      softDelete: false,
      exportRelations: [],
      toSyncRecord: (p) => ({
        key: p.key,
        value: Number(p.value),
        label: p.label,
        group: p.group,
        updatedAt: p.updatedAt.toISOString(),
        updatedBy: p.updatedBy?.id ?? (p as any).updatedById ?? null,
        _meta: { createdByEmail: p.updatedBy?.email },
      }),
      fromSyncRecord: async (r, ctx) => ({
        key: r.key,
        value: r.value,
        label: r.label,
        group: r.group,
        updatedAt: r.updatedAt,
        updatedBy: r.updatedBy ? await resolveEntityRef('users', r.updatedBy, ctx) : null,
      }),
      previewOne: async (r, ctx) => {
        const exists = await ctx.manager.findOne(PricingSetting, { where: { key: r.key } } as any);
        return !exists;
      },
    };
  }

  // ── MessageLog Handler ────────────────────────────────────────────────────

  private createMessageLogHandler(): EntitySyncHandler<any, MessageLog> {
    return {
      tableName: 'message_logs',
      softDelete: false,
      exportRelations: [],
      toSyncRecord: (m) => ({
        id: m.id,
        module: m.module,
        templateId: m.templateId,
        templateLabel: m.templateLabel,
        channel: m.channel,
        recipientName: m.recipientName,
        recipientPhone: m.recipientPhone,
        messageBody: m.messageBody,
        recordId: m.recordId,
        sentById: m.sentBy?.id ?? (m as any).sentById ?? null,
        createdAt: m.createdAt.toISOString(),
        _meta: { createdByEmail: m.sentBy?.email },
      }),
      fromSyncRecord: async (r, ctx) => ({
        id: r.id,
        module: r.module,
        templateId: r.templateId,
        templateLabel: r.templateLabel,
        channel: r.channel,
        recipientName: r.recipientName,
        recipientPhone: r.recipientPhone,
        messageBody: r.messageBody,
        recordId: r.recordId,
        sentById: r.sentById ? await resolveEntityRef('users', r.sentById, ctx) : null,
        createdAt: r.createdAt,
      }),
      previewOne: async (r, ctx) => {
        const exists = await ctx.manager.findOne(MessageLog, { where: { id: r.id } } as any);
        return !exists;
      },
    };
  }

  // ── Affidavit Handler ─────────────────────────────────────────────────────

  private createAffidavitHandler(): EntitySyncHandler<any, Affidavit> {
    return {
      tableName: 'affidavits',
      exportRelations: ['createdBy', 'customer'],
      toSyncRecord: (a) => ({
        id: a.id,
        customerName: a.customerName,
        phone: a.phone,
        purpose: a.purpose,
        affidavitNo: a.affidavitNo,
        paperType: a.paperType,
        authorizerType: a.authorizerType,
        authorizerName: a.authorizerName,
        dateOfService: a.dateOfService,
        amountCharged: Number(a.amountCharged),
        notaryPublicFee: a.notaryPublicFee != null ? Number(a.notaryPublicFee) : null,
        remark: a.remark,
        customerBroughtStamp: a.customerBroughtStamp,
        customerId: a.customer?.id ?? null,
        createdBy: a.createdBy.id,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
        deletedAt: a.deletedAt?.toISOString() ?? null,
        _meta: {
          createdByEmail: a.createdBy.email,
          customerPhone: a.customer?.phone ?? null,
          businessKey: { phone: a.phone, dateOfService: a.dateOfService, purpose: a.purpose },
        },
      }),
      fromSyncRecord: async (r, ctx) => ({
        id: r.id,
        customerName: r.customerName,
        phone: r.phone,
        purpose: r.purpose,
        affidavitNo: r.affidavitNo,
        paperType: r.paperType,
        authorizerType: r.authorizerType,
        authorizerName: r.authorizerName,
        dateOfService: r.dateOfService,
        amountCharged: r.amountCharged,
        notaryPublicFee: r.notaryPublicFee,
        remark: r.remark,
        customerBroughtStamp: r.customerBroughtStamp,
        customer: r.customerId ? { id: await resolveCustomer(r, ctx) } : null,
        createdBy: { id: await resolveCreatedBy(r, ctx) },
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
      }),
      previewOne: async (r, ctx) => {
        const byUuid = await ctx.manager.findOne(Affidavit, { where: { id: r.id } } as any);
        if (byUuid) return false;
        const byKey = await ctx.manager.findOne(Affidavit, {
          where: { phone: r.phone, dateOfService: r.dateOfService, purpose: r.purpose },
          withDeleted: false,
        } as any);
        return !byKey;
      },
    };
  }

  // ── Marriage Handler ──────────────────────────────────────────────────────

  private createMarriageHandler(): EntitySyncHandler<any, Marriage> {
    return {
      tableName: 'marriages',
      exportRelations: ['createdBy', 'customer', 'affidavits'],
      toSyncRecord: (m) => ({
        id: m.id,
        contactName: m.contactName,
        phone: m.phone,
        contactEmail: m.contactEmail,
        address: m.address,
        isPrimaryContactSpouse: m.isPrimaryContactSpouse,
        primaryContactSpouseType: m.primaryContactSpouseType,
        spouse1Name: m.spouse1Name,
        spouse2Name: m.spouse2Name,
        marriageAct: m.marriageAct,
        marriageDate: m.marriageDate,
        marriagePlace: m.marriagePlace,
        appointmentDate: m.appointmentDate,
        dateOfService: m.dateOfService,
        servicesProvided: m.servicesProvided ?? [],
        amountCharged: Number(m.amountCharged),
        officialFee: m.officialFee != null ? Number(m.officialFee) : null,
        courtFeeTickets: m.courtFeeTickets != null ? Number(m.courtFeeTickets) : null,
        miscFee: m.miscFee != null ? Number(m.miscFee) : null,
        consultancyFee: m.consultancyFee != null ? Number(m.consultancyFee) : null,
        applicationNo: m.applicationNo,
        customerId: m.customer?.id ?? null,
        createdBy: m.createdBy.id,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
        deletedAt: m.deletedAt?.toISOString() ?? null,
        affidavitIds: m.affidavits?.map((a) => a.id) ?? [],
        _meta: {
          createdByEmail: m.createdBy.email,
          customerPhone: m.customer?.phone ?? null,
          businessKey: { spouse1Name: m.spouse1Name, spouse2Name: m.spouse2Name, dateOfService: m.dateOfService },
        },
      }),
      fromSyncRecord: async (r, ctx) => ({
        id: r.id,
        contactName: r.contactName,
        phone: r.phone,
        contactEmail: r.contactEmail,
        address: r.address,
        isPrimaryContactSpouse: r.isPrimaryContactSpouse,
        primaryContactSpouseType: r.primaryContactSpouseType,
        spouse1Name: r.spouse1Name,
        spouse2Name: r.spouse2Name,
        marriageAct: r.marriageAct,
        marriageDate: r.marriageDate,
        marriagePlace: r.marriagePlace,
        appointmentDate: r.appointmentDate,
        dateOfService: r.dateOfService,
        servicesProvided: r.servicesProvided,
        amountCharged: r.amountCharged,
        officialFee: r.officialFee,
        courtFeeTickets: r.courtFeeTickets,
        miscFee: r.miscFee,
        consultancyFee: r.consultancyFee,
        applicationNo: r.applicationNo,
        customer: r.customerId ? { id: await resolveCustomer(r, ctx) } : null,
        createdBy: { id: await resolveCreatedBy(r, ctx) },
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
        affidavits: [], // M2M handled separately
      }),
      previewOne: async (r, ctx) => {
        const byUuid = await ctx.manager.findOne(Marriage, { where: { id: r.id } } as any);
        if (byUuid) return false;
        const byKey = await ctx.manager.findOne(Marriage, {
          where: { spouse1Name: r.spouse1Name, spouse2Name: r.spouse2Name, dateOfService: r.dateOfService },
          withDeleted: false,
        } as any);
        return !byKey;
      },
    };
  }

  // ── MarriageTicket Handler ────────────────────────────────────────────────

  private createMarriageTicketHandler(): EntitySyncHandler<any, MarriageTicket> {
    return {
      tableName: 'marriage_tickets',
      exportRelations: ['createdBy'],
      toSyncRecord: (t) => ({
        id: t.id,
        ticketNumber: t.ticketNumber,
        contactName: t.contactName,
        phone: t.phone,
        contactEmail: t.contactEmail,
        address: t.address,
        isPrimaryContactSpouse: t.isPrimaryContactSpouse,
        primaryContactSpouseType: t.primaryContactSpouseType,
        servicesProvided: t.servicesProvided ?? [],
        amountCharged: Number(t.amountCharged),
        questionnaireData: t.questionnaireData,
        status: t.status,
        marriageId: t.marriage?.id ?? null,
        createdBy: t.createdBy.id,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        deletedAt: t.deletedAt?.toISOString() ?? null,
        _meta: {
          createdByEmail: t.createdBy.email,
          businessKey: { ticketNumber: t.ticketNumber },
        },
      }),
      fromSyncRecord: async (r, ctx) => ({
        id: r.id,
        ticketNumber: r.ticketNumber,
        contactName: r.contactName,
        phone: r.phone,
        contactEmail: r.contactEmail,
        address: r.address,
        isPrimaryContactSpouse: r.isPrimaryContactSpouse,
        primaryContactSpouseType: r.primaryContactSpouseType,
        servicesProvided: r.servicesProvided,
        amountCharged: r.amountCharged,
        questionnaireData: r.questionnaireData,
        status: r.status,
        marriage: r.marriageId ? { id: r.marriageId } : null,
        createdBy: { id: await resolveCreatedBy(r, ctx) },
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
      }),
      previewOne: async (r, ctx) => {
        const byUuid = await ctx.manager.findOne(MarriageTicket, { where: { id: r.id } } as any);
        if (byUuid) return false;
        const byKey = await ctx.manager.findOne(MarriageTicket, { where: { ticketNumber: r.ticketNumber } } as any);
        return !byKey;
      },
    };
  }

  // ── MarriagePayment Handler ───────────────────────────────────────────────

  private createMarriagePaymentHandler(): EntitySyncHandler<any, MarriagePayment> {
    return {
      tableName: 'marriage_payments',
      exportRelations: ['createdBy'],
      toSyncRecord: (p) => ({
        id: p.id,
        amount: Number(p.amount),
        paymentMode: p.paymentMode,
        account: p.account,
        paymentDate: p.paymentDate,
        notes: p.notes,
        ticketId: p.ticket?.id ?? null,
        marriageId: p.marriage?.id ?? null,
        createdBy: p.createdBy.id,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        deletedAt: p.deletedAt?.toISOString() ?? null,
        _meta: { createdByEmail: p.createdBy.email },
      }),
      fromSyncRecord: async (r, ctx) => ({
        id: r.id,
        amount: r.amount,
        paymentMode: r.paymentMode,
        account: r.account,
        paymentDate: r.paymentDate,
        notes: r.notes,
        ticket: r.ticketId ? { id: r.ticketId } : null,
        marriage: r.marriageId ? { id: r.marriageId } : null,
        createdBy: { id: await resolveCreatedBy(r, ctx) },
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
      }),
      previewOne: async (r, ctx) => {
        const exists = await ctx.manager.findOne(MarriagePayment, { where: { id: r.id } } as any);
        return !exists;
      },
    };
  }

  // ── BirthDeathCertificate Handler ─────────────────────────────────────────

  private createBDCHandler(): EntitySyncHandler<any, BirthDeathCertificate> {
    return {
      tableName: 'birth_death_certificates',
      exportRelations: ['createdBy', 'customer'],
      toSyncRecord: (b) => ({
        id: b.id,
        certificateType: b.certificateType,
        customerName: b.customerName,
        phone: b.phone,
        personName: b.personName,
        eventDate: b.eventDate,
        dateOfService: b.dateOfService,
        numberOfCopies: b.numberOfCopies,
        amountCharged: Number(b.amountCharged),
        customerId: b.customer?.id ?? null,
        createdBy: b.createdBy.id,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
        deletedAt: b.deletedAt?.toISOString() ?? null,
        _meta: { createdByEmail: b.createdBy.email, customerPhone: b.customer?.phone ?? null },
      }),
      fromSyncRecord: async (r, ctx) => ({
        id: r.id,
        certificateType: r.certificateType,
        customerName: r.customerName,
        phone: r.phone,
        personName: r.personName,
        eventDate: r.eventDate,
        dateOfService: r.dateOfService,
        numberOfCopies: r.numberOfCopies,
        amountCharged: r.amountCharged,
        customer: r.customerId ? { id: await resolveCustomer(r, ctx) } : null,
        createdBy: { id: await resolveCreatedBy(r, ctx) },
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
      }),
      previewOne: async (r, ctx) => {
        const exists = await ctx.manager.findOne(BirthDeathCertificate, { where: { id: r.id } } as any);
        return !exists;
      },
    };
  }

  // ── PropertyCard Handler ──────────────────────────────────────────────────

  private createPropertyCardHandler(): EntitySyncHandler<any, PropertyCard> {
    return {
      tableName: 'property_cards',
      exportRelations: ['createdBy', 'customer'],
      toSyncRecord: (p) => ({
        id: p.id,
        customerName: p.customerName,
        phone: p.phone,
        recordType: p.recordType,
        propertyNumber: p.propertyNumber,
        dateOfService: p.dateOfService,
        amountCharged: Number(p.amountCharged),
        customerId: p.customer?.id ?? null,
        createdBy: p.createdBy.id,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        deletedAt: p.deletedAt?.toISOString() ?? null,
        _meta: { createdByEmail: p.createdBy.email, customerPhone: p.customer?.phone ?? null },
      }),
      fromSyncRecord: async (r, ctx) => ({
        id: r.id,
        customerName: r.customerName,
        phone: r.phone,
        recordType: r.recordType,
        propertyNumber: r.propertyNumber,
        dateOfService: r.dateOfService,
        amountCharged: r.amountCharged,
        customer: r.customerId ? { id: await resolveCustomer(r, ctx) } : null,
        createdBy: { id: await resolveCreatedBy(r, ctx) },
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
      }),
      previewOne: async (r, ctx) => {
        const exists = await ctx.manager.findOne(PropertyCard, { where: { id: r.id } } as any);
        return !exists;
      },
    };
  }

  // ── ShopActLicense Handler ────────────────────────────────────────────────

  private createShopActHandler(): EntitySyncHandler<any, ShopActLicense> {
    return {
      tableName: 'shop_act_licenses',
      exportRelations: ['createdBy', 'customer'],
      toSyncRecord: (s) => ({
        id: s.id,
        customerName: s.customerName,
        phone: s.phone,
        businessName: s.businessName,
        email: s.email,
        dateOfService: s.dateOfService,
        amountCharged: Number(s.amountCharged),
        customerId: s.customer?.id ?? null,
        createdBy: s.createdBy.id,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        deletedAt: s.deletedAt?.toISOString() ?? null,
        _meta: { createdByEmail: s.createdBy.email, customerPhone: s.customer?.phone ?? null },
      }),
      fromSyncRecord: async (r, ctx) => ({
        id: r.id,
        customerName: r.customerName,
        phone: r.phone,
        businessName: r.businessName,
        email: r.email,
        dateOfService: r.dateOfService,
        amountCharged: r.amountCharged,
        customer: r.customerId ? { id: await resolveCustomer(r, ctx) } : null,
        createdBy: { id: await resolveCreatedBy(r, ctx) },
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
      }),
      previewOne: async (r, ctx) => {
        const exists = await ctx.manager.findOne(ShopActLicense, { where: { id: r.id } } as any);
        return !exists;
      },
    };
  }

  // ── PropertyTax Handler ───────────────────────────────────────────────────

  private createPropertyTaxHandler(): EntitySyncHandler<any, PropertyTax> {
    return {
      tableName: 'property_tax_records',
      exportRelations: ['createdBy', 'customer'],
      toSyncRecord: (p) => ({
        id: p.id,
        serviceType: p.serviceType,
        customerName: p.customerName,
        phone: p.phone,
        address: p.address,
        propertyTaxNo: p.propertyTaxNo,
        officialFee: Number(p.officialFee),
        serviceFee: Number(p.serviceFee),
        protocolFee: Number(p.protocolFee),
        amountCharged: Number(p.amountCharged),
        dateOfService: p.dateOfService,
        customerId: p.customer?.id ?? null,
        createdBy: p.createdBy.id,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        deletedAt: p.deletedAt?.toISOString() ?? null,
        _meta: { createdByEmail: p.createdBy.email, customerPhone: p.customer?.phone ?? null },
      }),
      fromSyncRecord: async (r, ctx) => ({
        id: r.id,
        serviceType: r.serviceType,
        customerName: r.customerName,
        phone: r.phone,
        address: r.address,
        propertyTaxNo: r.propertyTaxNo,
        officialFee: r.officialFee,
        serviceFee: r.serviceFee,
        protocolFee: r.protocolFee,
        amountCharged: r.amountCharged,
        dateOfService: r.dateOfService,
        customer: r.customerId ? { id: await resolveCustomer(r, ctx) } : null,
        createdBy: { id: await resolveCreatedBy(r, ctx) },
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
      }),
      previewOne: async (r, ctx) => {
        const exists = await ctx.manager.findOne(PropertyTax, { where: { id: r.id } } as any);
        return !exists;
      },
    };
  }

  // ── Business Handler ──────────────────────────────────────────────────────

  private createBusinessHandler(): EntitySyncHandler<any, Business> {
    return {
      tableName: 'businesses',
      exportRelations: [],
      toSyncRecord: (b) => ({
        id: b.id,
        name: b.name,
        licenseNo: b.licenseNo,
        tradeType: b.tradeType,
        tradeSubtype: b.tradeSubtype,
        email: b.email,
        phone: b.phone,
        status: b.status,
        lastRenewalYear: b.lastRenewalYear,
        completionCertificateStatus: b.completionCertificateStatus,
        completionCertificateSubmittedAt: b.completionCertificateSubmittedAt,
        completionCertificateVerificationStatus: b.completionCertificateVerificationStatus,
        completionCertificateVerifiedAt: b.completionCertificateVerifiedAt,
        isTenant: b.isTenant,
        depositFeeCharged: b.depositFeeCharged,
        depositFeeAmount: Number(b.depositFeeAmount),
        depositFeeCollectionDate: b.depositFeeCollectionDate,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
        deletedAt: b.deletedAt?.toISOString() ?? null,
        customerIds: (b as any).customers?.map((c: any) => c.id) ?? [],
        _meta: {},
      }),
      fromSyncRecord: async (r, ctx) => ({
        id: r.id,
        name: r.name,
        licenseNo: r.licenseNo,
        tradeType: r.tradeType,
        tradeSubtype: r.tradeSubtype,
        email: r.email,
        phone: r.phone,
        status: r.status,
        lastRenewalYear: r.lastRenewalYear,
        completionCertificateStatus: r.completionCertificateStatus,
        completionCertificateSubmittedAt: r.completionCertificateSubmittedAt,
        completionCertificateVerificationStatus: r.completionCertificateVerificationStatus,
        completionCertificateVerifiedAt: r.completionCertificateVerifiedAt,
        isTenant: r.isTenant,
        depositFeeCharged: r.depositFeeCharged,
        depositFeeAmount: r.depositFeeAmount,
        depositFeeCollectionDate: r.depositFeeCollectionDate,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
      }),
      previewOne: async (r, ctx) => {
        const exists = await ctx.manager.findOne(Business, { where: { id: r.id } } as any);
        return !exists;
      },
    };
  }

  // ── BusinessTrade Handler ─────────────────────────────────────────────────

  private createBusinessTradeHandler(): EntitySyncHandler<any, BusinessTrade> {
    return {
      tableName: 'business_trades',
      exportRelations: [],
      toSyncRecord: (t) => ({
        id: t.id,
        businessId: t.business?.id ?? (t as any).businessId,
        tradeType: t.tradeType,
        tradeSubtype: t.tradeSubtype,
        createdAt: t.createdAt.toISOString(),
        deletedAt: t.deletedAt?.toISOString() ?? null,
        _meta: {},
      }),
      fromSyncRecord: async (r, ctx) => ({
        id: r.id,
        businessId: await resolveEntityRef('businesses', r.businessId, ctx),
        tradeType: r.tradeType,
        tradeSubtype: r.tradeSubtype,
        createdAt: r.createdAt,
        deletedAt: r.deletedAt,
      }),
      previewOne: async (r, ctx) => {
        const exists = await ctx.manager.findOne(BusinessTrade, { where: { id: r.id } } as any);
        return !exists;
      },
    };
  }

  // ── TradeTypeConfig Handler ────────────────────────────────────────────────

  private createTradeTypeConfigHandler(): EntitySyncHandler<any, TradeTypeConfig> {
    return {
      tableName: 'trade_type_configs',
      exportRelations: [],
      toSyncRecord: (t) => ({
        id: t.id,
        tradeType: t.tradeType,
        tradeSubtype: t.tradeSubtype,
        licenseFee: Number(t.licenseFee),
        fireFee: Number(t.fireFee),
        renewalFireFee: Number(t.renewalFireFee),
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        deletedAt: t.deletedAt?.toISOString() ?? null,
        _meta: { businessKey: { tradeType: t.tradeType, tradeSubtype: t.tradeSubtype } },
      }),
      fromSyncRecord: async (r) => ({
        id: r.id,
        tradeType: r.tradeType,
        tradeSubtype: r.tradeSubtype,
        licenseFee: r.licenseFee,
        fireFee: r.fireFee,
        renewalFireFee: r.renewalFireFee,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
      }),
      previewOne: async (r, ctx) => {
        const byUuid = await ctx.manager.findOne(TradeTypeConfig, { where: { id: r.id } } as any);
        if (byUuid) return false;
        const byKey = await ctx.manager.findOne(TradeTypeConfig, {
          where: { tradeType: r.tradeType, tradeSubtype: r.tradeSubtype },
        } as any);
        return !byKey;
      },
    };
  }

  // ── TradeLicenseRecord Handler ────────────────────────────────────────────

  private createTradeLicenseRecordHandler(): EntitySyncHandler<any, TradeLicenseRecord> {
    return {
      tableName: 'trade_license_records',
      exportRelations: ['createdBy', 'business', 'linkedAffidavit', 'linkedPropertyCard', 'linkedShopAct'],
      toSyncRecord: (r) => ({
        id: r.id,
        serviceType: r.serviceType,
        dateOfService: r.dateOfService,
        amountCharged: Number(r.amountCharged),
        licenseFee: Number(r.licenseFee),
        fireFee: Number(r.fireFee),
        depositFee: Number(r.depositFee),
        serviceFee: Number(r.serviceFee),
        protocolFee: r.protocolFee != null ? Number(r.protocolFee) : null,
        miscFee: r.miscFee != null ? Number(r.miscFee) : null,
        tokenNo: r.tokenNo,
        details: r.details,
        businessId: r.business?.id ?? (r as any).businessId,
        createdBy: r.createdBy.id,
        linkedAffidavitId: r.linkedAffidavit?.id ?? null,
        linkedPropertyCardId: r.linkedPropertyCard?.id ?? null,
        linkedShopActId: r.linkedShopAct?.id ?? null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        deletedAt: r.deletedAt?.toISOString() ?? null,
        _meta: { createdByEmail: r.createdBy.email },
      }),
      fromSyncRecord: async (r, ctx) => ({
        id: r.id,
        serviceType: r.serviceType,
        dateOfService: r.dateOfService,
        amountCharged: r.amountCharged,
        licenseFee: r.licenseFee,
        fireFee: r.fireFee,
        depositFee: r.depositFee,
        serviceFee: r.serviceFee,
        protocolFee: r.protocolFee,
        miscFee: r.miscFee,
        tokenNo: r.tokenNo,
        details: r.details,
        business: { id: r.businessId },
        createdBy: { id: await resolveCreatedBy(r, ctx) },
        linkedAffidavit: r.linkedAffidavitId ? { id: r.linkedAffidavitId } : null,
        linkedPropertyCard: r.linkedPropertyCardId ? { id: r.linkedPropertyCardId } : null,
        linkedShopAct: r.linkedShopActId ? { id: r.linkedShopActId } : null,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
      }),
      previewOne: async (r, ctx) => {
        const exists = await ctx.manager.findOne(TradeLicenseRecord, { where: { id: r.id } } as any);
        return !exists;
      },
    };
  }

  // ── TradeLicensePayment Handler ───────────────────────────────────────────

  private createTradeLicensePaymentHandler(): EntitySyncHandler<any, TradeLicensePayment> {
    return {
      tableName: 'trade_license_payments',
      exportRelations: ['createdBy'],
      toSyncRecord: (p) => ({
        id: p.id,
        amount: Number(p.amount),
        paymentMode: p.paymentMode,
        account: p.account,
        paymentDate: p.paymentDate,
        notes: p.notes,
        recordId: p.record?.id ?? (p as any).recordId,
        createdBy: p.createdBy.id,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        deletedAt: p.deletedAt?.toISOString() ?? null,
        _meta: { createdByEmail: p.createdBy.email },
      }),
      fromSyncRecord: async (r, ctx) => ({
        id: r.id,
        amount: r.amount,
        paymentMode: r.paymentMode,
        account: r.account,
        paymentDate: r.paymentDate,
        notes: r.notes,
        record: { id: r.recordId },
        createdBy: { id: await resolveCreatedBy(r, ctx) },
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
      }),
      previewOne: async (r, ctx) => {
        const exists = await ctx.manager.findOne(TradeLicensePayment, { where: { id: r.id } } as any);
        return !exists;
      },
    };
  }

  // ── PanCardRecord Handler ─────────────────────────────────────────────────

  private createPanCardHandler(): EntitySyncHandler<any, PanCardRecord> {
    return {
      tableName: 'pan_card_records',
      exportRelations: ['createdBy', 'customer'],
      toSyncRecord: (p) => ({
        id: p.id,
        customerName: p.customerName,
        phone: p.phone,
        applicationType: p.applicationType,
        ackNo: p.ackNo,
        dateOfService: p.dateOfService,
        officialFee: Number(p.officialFee),
        serviceFee: Number(p.serviceFee),
        amountCharged: Number(p.amountCharged),
        customerId: p.customer?.id ?? null,
        createdBy: p.createdBy.id,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        deletedAt: p.deletedAt?.toISOString() ?? null,
        _meta: { createdByEmail: p.createdBy.email, customerPhone: p.customer?.phone ?? null },
      }),
      fromSyncRecord: async (r, ctx) => ({
        id: r.id,
        customerName: r.customerName,
        phone: r.phone,
        applicationType: r.applicationType,
        ackNo: r.ackNo,
        dateOfService: r.dateOfService,
        officialFee: r.officialFee,
        serviceFee: r.serviceFee,
        amountCharged: r.amountCharged,
        customer: r.customerId ? { id: await resolveCustomer(r, ctx) } : null,
        createdBy: { id: await resolveCreatedBy(r, ctx) },
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
      }),
      previewOne: async (r, ctx) => {
        const exists = await ctx.manager.findOne(PanCardRecord, { where: { id: r.id } } as any);
        return !exists;
      },
    };
  }

  // ── PassportRecord Handler ────────────────────────────────────────────────

  private createPassportHandler(): EntitySyncHandler<any, PassportRecord> {
    return {
      tableName: 'passport_records',
      exportRelations: ['createdBy', 'customer'],
      toSyncRecord: (p) => ({
        id: p.id,
        customerName: p.customerName,
        phone: p.phone,
        applicationType: p.applicationType,
        fileNo: p.fileNo,
        appointmentDate: p.appointmentDate,
        dateOfService: p.dateOfService,
        officialFee: Number(p.officialFee),
        serviceFee: Number(p.serviceFee),
        amountCharged: Number(p.amountCharged),
        customerId: p.customer?.id ?? null,
        createdBy: p.createdBy.id,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        deletedAt: p.deletedAt?.toISOString() ?? null,
        _meta: { createdByEmail: p.createdBy.email, customerPhone: p.customer?.phone ?? null },
      }),
      fromSyncRecord: async (r, ctx) => ({
        id: r.id,
        customerName: r.customerName,
        phone: r.phone,
        applicationType: r.applicationType,
        fileNo: r.fileNo,
        appointmentDate: r.appointmentDate,
        dateOfService: r.dateOfService,
        officialFee: r.officialFee,
        serviceFee: r.serviceFee,
        amountCharged: r.amountCharged,
        customer: r.customerId ? { id: await resolveCustomer(r, ctx) } : null,
        createdBy: { id: await resolveCreatedBy(r, ctx) },
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
      }),
      previewOne: async (r, ctx) => {
        const exists = await ctx.manager.findOne(PassportRecord, { where: { id: r.id } } as any);
        return !exists;
      },
    };
  }

  // ── VoterCardRecord Handler ───────────────────────────────────────────────

  private createVoterCardHandler(): EntitySyncHandler<any, VoterCardRecord> {
    return {
      tableName: 'voter_card_records',
      exportRelations: ['createdBy', 'customer'],
      toSyncRecord: (v) => ({
        id: v.id,
        customerName: v.customerName,
        phone: v.phone,
        applicationType: v.applicationType,
        epicNo: v.epicNo,
        tokenNo: v.tokenNo,
        dateOfService: v.dateOfService,
        officialFee: Number(v.officialFee),
        serviceFee: Number(v.serviceFee),
        amountCharged: Number(v.amountCharged),
        customerId: v.customer?.id ?? null,
        createdBy: v.createdBy.id,
        createdAt: v.createdAt.toISOString(),
        updatedAt: v.updatedAt.toISOString(),
        deletedAt: v.deletedAt?.toISOString() ?? null,
        _meta: { createdByEmail: v.createdBy.email, customerPhone: v.customer?.phone ?? null },
      }),
      fromSyncRecord: async (r, ctx) => ({
        id: r.id,
        customerName: r.customerName,
        phone: r.phone,
        applicationType: r.applicationType,
        epicNo: r.epicNo,
        tokenNo: r.tokenNo,
        dateOfService: r.dateOfService,
        officialFee: r.officialFee,
        serviceFee: r.serviceFee,
        amountCharged: r.amountCharged,
        customer: r.customerId ? { id: await resolveCustomer(r, ctx) } : null,
        createdBy: { id: await resolveCreatedBy(r, ctx) },
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
      }),
      previewOne: async (r, ctx) => {
        const exists = await ctx.manager.findOne(VoterCardRecord, { where: { id: r.id } } as any);
        return !exists;
      },
    };
  }

  // ── Gazette Handler ───────────────────────────────────────────────────────

  private createGazetteHandler(): EntitySyncHandler<any, Gazette> {
    return {
      tableName: 'gazettes',
      exportRelations: ['createdBy', 'customer'],
      toSyncRecord: (g) => ({
        id: g.id,
        customerName: g.customerName,
        phone: g.phone,
        oldName: g.oldName,
        newName: g.newName,
        reasonToChangeName: g.reasonToChangeName,
        tokenNo: g.tokenNo,
        dateOfService: g.dateOfService,
        officialFee: Number(g.officialFee),
        serviceFee: Number(g.serviceFee),
        amountCharged: Number(g.amountCharged),
        customerId: g.customer?.id ?? null,
        createdBy: g.createdBy.id,
        createdAt: g.createdAt.toISOString(),
        updatedAt: g.updatedAt.toISOString(),
        deletedAt: g.deletedAt?.toISOString() ?? null,
        _meta: { createdByEmail: g.createdBy.email, customerPhone: g.customer?.phone ?? null },
      }),
      fromSyncRecord: async (r, ctx) => ({
        id: r.id,
        customerName: r.customerName,
        phone: r.phone,
        oldName: r.oldName,
        newName: r.newName,
        reasonToChangeName: r.reasonToChangeName,
        tokenNo: r.tokenNo,
        dateOfService: r.dateOfService,
        officialFee: r.officialFee,
        serviceFee: r.serviceFee,
        amountCharged: r.amountCharged,
        customer: r.customerId ? { id: await resolveCustomer(r, ctx) } : null,
        createdBy: { id: await resolveCreatedBy(r, ctx) },
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
      }),
      previewOne: async (r, ctx) => {
        const exists = await ctx.manager.findOne(Gazette, { where: { id: r.id } } as any);
        return !exists;
      },
    };
  }

  // ── WaterConnection Handler ───────────────────────────────────────────────

  private createWaterConnectionHandler(): EntitySyncHandler<any, WaterConnection> {
    return {
      tableName: 'water_connections',
      exportRelations: ['createdBy', 'customer'],
      toSyncRecord: (w) => ({
        id: w.id,
        connectionNo: w.connectionNo,
        currentOwner: w.currentOwner,
        connectionAddress: w.connectionAddress,
        contactPersonName: w.contactPersonName,
        contactPersonPhone: w.contactPersonPhone,
        currentUsage: w.currentUsage,
        connectionStatus: w.connectionStatus,
        meterDetails: w.meterDetails,
        customerId: w.customer?.id ?? null,
        createdBy: w.createdBy.id,
        createdAt: w.createdAt.toISOString(),
        updatedAt: w.updatedAt.toISOString(),
        deletedAt: w.deletedAt?.toISOString() ?? null,
        _meta: { createdByEmail: w.createdBy.email, customerPhone: w.customer?.phone ?? null },
      }),
      fromSyncRecord: async (r, ctx) => ({
        id: r.id,
        connectionNo: r.connectionNo,
        currentOwner: r.currentOwner,
        connectionAddress: r.connectionAddress,
        contactPersonName: r.contactPersonName,
        contactPersonPhone: r.contactPersonPhone,
        currentUsage: r.currentUsage,
        connectionStatus: r.connectionStatus,
        meterDetails: r.meterDetails,
        customer: r.customerId ? { id: await resolveCustomer(r, ctx) } : null,
        createdBy: { id: await resolveCreatedBy(r, ctx) },
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
      }),
      previewOne: async (r, ctx) => {
        const byUuid = await ctx.manager.findOne(WaterConnection, { where: { id: r.id } } as any);
        if (byUuid) return false;
        if (r.connectionNo) {
          const byKey = await ctx.manager.findOne(WaterConnection, { where: { connectionNo: r.connectionNo } } as any);
          if (byKey) return false;
        }
        return true;
      },
    };
  }

  // ── WaterServiceRecord Handler ────────────────────────────────────────────

  private createWaterServiceRecordHandler(): EntitySyncHandler<any, WaterServiceRecord> {
    return {
      tableName: 'water_service_records',
      exportRelations: ['createdBy'],
      toSyncRecord: (w) => ({
        id: w.id,
        serviceType: w.serviceType,
        dateOfService: w.dateOfService,
        applicationDate: w.applicationDate,
        applicationTokenNo: w.applicationTokenNo,
        officialFee: Number(w.officialFee),
        serviceFee: Number(w.serviceFee),
        protocolFee: w.protocolFee != null ? Number(w.protocolFee) : null,
        miscFee: w.miscFee != null ? Number(w.miscFee) : null,
        discount: Number(w.discount),
        amountCharged: Number(w.amountCharged),
        remarks: w.remarks,
        details: w.details,
        connectionId: w.connection?.id ?? (w as any).connectionId,
        createdBy: w.createdBy.id,
        createdAt: w.createdAt.toISOString(),
        updatedAt: w.updatedAt.toISOString(),
        deletedAt: w.deletedAt?.toISOString() ?? null,
        _meta: { createdByEmail: w.createdBy.email },
      }),
      fromSyncRecord: async (r, ctx) => ({
        id: r.id,
        serviceType: r.serviceType,
        dateOfService: r.dateOfService,
        applicationDate: r.applicationDate,
        applicationTokenNo: r.applicationTokenNo,
        officialFee: r.officialFee,
        serviceFee: r.serviceFee,
        protocolFee: r.protocolFee,
        miscFee: r.miscFee,
        discount: r.discount,
        amountCharged: r.amountCharged,
        remarks: r.remarks,
        details: r.details,
        connection: { id: r.connectionId },
        createdBy: { id: await resolveCreatedBy(r, ctx) },
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
      }),
      previewOne: async (r, ctx) => {
        const byUuid = await ctx.manager.findOne(WaterServiceRecord, { where: { id: r.id } } as any);
        if (byUuid) return false;
        if (r.applicationTokenNo) {
          const byKey = await ctx.manager.findOne(WaterServiceRecord, { where: { applicationTokenNo: r.applicationTokenNo } } as any);
          if (byKey) return false;
        }
        return true;
      },
    };
  }

  // ── WaterPayment Handler ──────────────────────────────────────────────────

  private createWaterPaymentHandler(): EntitySyncHandler<any, WaterPayment> {
    return {
      tableName: 'water_payments',
      exportRelations: ['createdBy'],
      toSyncRecord: (p) => ({
        id: p.id,
        amount: Number(p.amount),
        paymentMode: p.paymentMode,
        paymentDate: p.paymentDate,
        account: p.account,
        referenceNumber: p.referenceNumber,
        notes: p.notes,
        recordId: p.record?.id ?? (p as any).recordId,
        createdBy: p.createdBy.id,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        deletedAt: p.deletedAt?.toISOString() ?? null,
        _meta: { createdByEmail: p.createdBy.email },
      }),
      fromSyncRecord: async (r, ctx) => ({
        id: r.id,
        amount: r.amount,
        paymentMode: r.paymentMode,
        paymentDate: r.paymentDate,
        account: r.account,
        referenceNumber: r.referenceNumber,
        notes: r.notes,
        record: { id: r.recordId },
        createdBy: { id: await resolveCreatedBy(r, ctx) },
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
      }),
      previewOne: async (r, ctx) => {
        const exists = await ctx.manager.findOne(WaterPayment, { where: { id: r.id } } as any);
        return !exists;
      },
    };
  }

  // ── WaterDocument Handler ─────────────────────────────────────────────────

  private createWaterDocumentHandler(): EntitySyncHandler<any, WaterDocument> {
    return {
      tableName: 'water_documents',
      exportRelations: ['createdBy'],
      toSyncRecord: (d) => ({
        id: d.id,
        documentType: d.documentType,
        fileName: d.fileName,
        remarks: d.remarks,
        recordId: d.serviceRecord?.id ?? (d as any).recordId,
        createdBy: d.createdBy.id,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
        deletedAt: d.deletedAt?.toISOString() ?? null,
        _meta: { createdByEmail: d.createdBy.email },
      }),
      fromSyncRecord: async (r, ctx) => ({
        id: r.id,
        documentType: r.documentType,
        fileName: r.fileName,
        remarks: r.remarks,
        record: { id: r.recordId },
        createdBy: { id: await resolveCreatedBy(r, ctx) },
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
      }),
      previewOne: async (r, ctx) => {
        const exists = await ctx.manager.findOne(WaterDocument, { where: { id: r.id } } as any);
        return !exists;
      },
    };
  }

  // ── WaterFeeConfig Handler ────────────────────────────────────────────────

  private createWaterFeeConfigHandler(): EntitySyncHandler<any, WaterFeeConfig> {
    return {
      tableName: 'water_fee_configs',
      exportRelations: [],
      toSyncRecord: (f) => ({
        id: f.id,
        serviceType: f.serviceType,
        officialFee: Number(f.officialFee),
        serviceFee: Number(f.serviceFee),
        protocolFee: Number(f.protocolFee),
        defaultMiscFee: Number(f.defaultMiscFee),
        allowManualOverride: f.allowManualOverride,
        effectiveDate: f.effectiveDate ?? null,
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString(),
        deletedAt: f.deletedAt?.toISOString() ?? null,
        _meta: { businessKey: { serviceType: f.serviceType } },
      }),
      fromSyncRecord: async (r) => ({
        id: r.id,
        serviceType: r.serviceType,
        officialFee: r.officialFee,
        serviceFee: r.serviceFee,
        protocolFee: r.protocolFee,
        defaultMiscFee: r.defaultMiscFee,
        allowManualOverride: r.allowManualOverride,
        effectiveDate: r.effectiveDate,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
      }),
      previewOne: async (r, ctx) => {
        const byUuid = await ctx.manager.findOne(WaterFeeConfig, { where: { id: r.id } } as any);
        if (byUuid) return false;
        const byKey = await ctx.manager.findOne(WaterFeeConfig, { where: { serviceType: r.serviceType } } as any);
        return !byKey;
      },
    };
  }

  // ── Orchestration: Export ─────────────────────────────────────────────────

  async exportEntities(tableNames: string[]): Promise<{
    records: Record<string, any[]>;
  }> {
    const records: Record<string, any[]> = {};

    for (const tableName of this.getSortedTableNames(tableNames)) {
      const handler = this.handlers.get(tableName);
      if (!handler) continue;

      this.logger.log(`[Sync Export] Exporting ${tableName}`);

      let entities: any[];
      const repo = this.getRepo(tableName);
      const where = handler.softDelete !== false ? { deletedAt: null } as any : {};

      if (handler.exportRelations.length > 0) {
        entities = await repo.find({ where, relations: handler.exportRelations });
      } else {
        entities = await repo.find({ where });
      }

      records[tableName] = entities.map((e) => handler.toSyncRecord(e));
    }

    return { records };
  }

  // ── Orchestration: Preview ────────────────────────────────────────────────

  async previewImport(
    records: Record<string, any[]>,
  ): Promise<SyncPreviewResult> {
    const ctx = this.createContext();
    const summary: SyncPreviewRow[] = [];
    const sorted = this.getSortedTableNames(Object.keys(records));

    for (const tableName of sorted) {
      const list = records[tableName];
      if (!list || list.length === 0) continue;
      const handler = this.handlers.get(tableName);
      if (!handler || !handler.previewOne) continue;

      let toInsert = 0;
      let alreadyExist = 0;
      const errors: string[] = [];

      for (const record of list) {
        try {
          const pkField = handler.primaryKey || 'id';
          const pkValue = record[pkField];
          // Check UUID exists (skip for records without a PK value, e.g. v1 -> v2 upgrade)
          if (pkValue != null) {
            const uuidCheck = await ctx.manager
              .getRepository(this.getEntityClass(tableName))
              .findOne({ where: { [pkField]: pkValue } as any, withDeleted: true });
            if (uuidCheck) { alreadyExist++; continue; }
          }

          const isNew = await handler.previewOne(record, ctx);
          if (isNew) toInsert++;
          else alreadyExist++;
        } catch (err: any) {
          errors.push(`[${tableName}] ${err.message}`);
        }
      }

      summary.push({ table: tableName, toInsert, alreadyExist, errors });
    }

    const totalNew = summary.reduce((s, r) => s + r.toInsert, 0);
    const totalSkipped = summary.reduce((s, r) => s + r.alreadyExist, 0);
    const totalErrors = summary.reduce((s, r) => s + r.errors.length, 0);
    return { valid: totalErrors === 0, summary, totalNew, totalSkipped, totalErrors };
  }

  // ── Orchestration: Import ─────────────────────────────────────────────────

  async importRecords(
    records: Record<string, any[]>,
  ): Promise<SyncImportResult> {
    const ctx = this.createContext();
    const details: { table: string; inserted: number; skipped: number }[] = [];

    await ctx.manager.transaction(async (manager) => {
      ctx.manager = manager;
      const sorted = this.getSortedTableNames(Object.keys(records));

      for (const tableName of sorted) {
        const list = records[tableName];
        if (!list || list.length === 0) continue;
        const handler = this.handlers.get(tableName);
        if (!handler) continue;

        this.logger.log(`[Sync Import] Importing ${tableName}: ${list.length} records`);
        let inserted = 0;
        let skipped = 0;

        for (const record of list) {
          try {
            const pkField = handler.primaryKey || 'id';
            const pkValue = record[pkField];
            // Check PK exists (skip for records without a PK value, e.g. v1 -> v2 upgrade)
            if (pkValue != null) {
              const existing = await manager
                .getRepository(this.getEntityClass(tableName))
                .findOne({ where: { [pkField]: pkValue } as any, withDeleted: true });
              if (existing) { skipped++; continue; }
            }

            // Check business key (if defined)
            const bk = BUSINESS_KEYS[tableName];
            if (bk && bk.length > 0) {
              const where: any = {};
              for (const key of bk) {
                if (record[key] != null) where[key] = record[key];
              }
              if (Object.keys(where).length > 0) {
                const existingByKey = await manager
                  .getRepository(this.getEntityClass(tableName))
                  .findOne({ where, withDeleted: false } as any);
                if (existingByKey) { skipped++; continue; }
              }
            }

            // Resolve FKs and build entity
            const partial = await handler.fromSyncRecord(record, ctx);
            const resolvedPkValue = partial[pkField];
            const repo = manager.getRepository(this.getEntityClass(tableName));

            // Insert with original UUID via query builder
            await repo
              .createQueryBuilder()
              .insert()
              .values(partial as any)
              .orIgnore()
              .execute();

            // Track PK mapping
            let uuidMap = ctx.entityUuidMaps.get(tableName);
            if (!uuidMap) {
              uuidMap = new Map();
              ctx.entityUuidMaps.set(tableName, uuidMap);
            }
            uuidMap.set(pkValue != null ? String(pkValue) : String(resolvedPkValue), resolvedPkValue);

            // For User, also track email map
            if (tableName === 'users') {
              ctx.userEmailMap.set(record.email, resolvedPkValue);
            }
            // For Customer, track phone map
            if (tableName === 'customers' && record.phone) {
              ctx.customerPhoneMap.set(record.phone, resolvedPkValue);
            }

            inserted++;
          } catch (err: any) {
            const errPkField = handler.primaryKey || 'id';
            ctx.errors.push(`[${tableName}] Error inserting record ${errPkField}=${record[errPkField]}: ${err.message}`);
            skipped++;
          }
        }

        details.push({ table: tableName, inserted, skipped });
        this.logger.log(`[Sync Import] ${tableName}: ${inserted} inserted, ${skipped} skipped`);
      }

      // Handle M2M join tables from parent records
      const businessRecords = records['businesses'];
      if (businessRecords) {
        for (const b of businessRecords) {
          if (b.customerIds && b.customerIds.length > 0) {
            for (const cid of b.customerIds) {
              try {
                await manager.query(
                  `INSERT INTO "business_customers" ("business_id", "customer_id") VALUES ('${b.id}', '${cid}') ON CONFLICT DO NOTHING`,
                );
              } catch (err: any) {
                ctx.errors.push(`[M2M:business_customers] ${err.message}`);
              }
            }
          }
        }
      }
      const marriageRecords = records['marriages'];
      if (marriageRecords) {
        for (const m of marriageRecords) {
          if (m.affidavitIds && m.affidavitIds.length > 0) {
            for (const aid of m.affidavitIds) {
              try {
                await manager.query(
                  `INSERT INTO "marriage_affidavits" ("marriageId", "affidavitId") VALUES ('${m.id}', '${aid}') ON CONFLICT DO NOTHING`,
                );
              } catch (err: any) {
                ctx.errors.push(`[M2M:marriage_affidavits] ${err.message}`);
              }
            }
          }
        }
      }
    });

    const inserted = details.reduce((s, d) => s + d.inserted, 0);
    const skipped = details.reduce((s, d) => s + d.skipped, 0);
    return { inserted, skipped, errors: ctx.errors, details };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private createContext(): ImportContext {
    return {
      manager: null as any,
      userEmailMap: new Map(),
      userUuidMap: new Map(),
      customerPhoneMap: new Map(),
      customerUuidMap: new Map(),
      entityUuidMaps: new Map(),
      errors: [],
      stats: new Map(),
    };
  }

  private getRepo(tableName: string): Repository<any> {
    const map: Record<string, Repository<any>> = {
      users: this.userRepo,
      passkeys: this.passkeyRepo,
      customers: this.customerRepo,
      activity_logs: this.activityLogRepo,
      expenses: this.expenseRepo,
      pricing_settings: this.pricingSettingRepo,
      message_logs: this.messageLogRepo,
      affidavits: this.affidavitRepo,
      marriages: this.marriageRepo,
      marriage_tickets: this.marriageTicketRepo,
      marriage_payments: this.marriagePaymentRepo,
      birth_death_certificates: this.bdcRepo,
      property_cards: this.propertyCardRepo,
      shop_act_licenses: this.shopActRepo,
      property_tax_records: this.propertyTaxRepo,
      businesses: this.businessRepo,
      business_trades: this.businessTradeRepo,
      trade_type_configs: this.tradeTypeConfigRepo,
      trade_license_records: this.tradeLicRecordRepo,
      trade_license_payments: this.tradeLicPaymentRepo,
      pan_card_records: this.panCardRepo,
      passport_records: this.passportRepo,
      voter_card_records: this.voterCardRepo,
      gazettes: this.gazetteRepo,
      water_connections: this.waterConnRepo,
      water_service_records: this.waterSvcRepo,
      water_payments: this.waterPayRepo,
      water_documents: this.waterDocRepo,
      water_fee_configs: this.waterFeeRepo,
    };
    return map[tableName];
  }

  private getEntityClass(tableName: string): any {
    const map: Record<string, any> = {
      users: User,
      passkeys: Passkey,
      customers: Customer,
      activity_logs: ActivityLog,
      expenses: Expense,
      pricing_settings: PricingSetting,
      message_logs: MessageLog,
      affidavits: Affidavit,
      marriages: Marriage,
      marriage_tickets: MarriageTicket,
      marriage_payments: MarriagePayment,
      birth_death_certificates: BirthDeathCertificate,
      property_cards: PropertyCard,
      shop_act_licenses: ShopActLicense,
      property_tax_records: PropertyTax,
      businesses: Business,
      business_trades: BusinessTrade,
      trade_type_configs: TradeTypeConfig,
      trade_license_records: TradeLicenseRecord,
      trade_license_payments: TradeLicensePayment,
      pan_card_records: PanCardRecord,
      passport_records: PassportRecord,
      voter_card_records: VoterCardRecord,
      gazettes: Gazette,
      water_connections: WaterConnection,
      water_service_records: WaterServiceRecord,
      water_payments: WaterPayment,
      water_documents: WaterDocument,
      water_fee_configs: WaterFeeConfig,
    };
    return map[tableName];
  }
}
