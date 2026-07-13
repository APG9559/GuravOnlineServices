import { Role } from '../common/enums';

// ── Meta ─────────────────────────────────────────────────────────────────────

export interface SyncMeta {
  createdByEmail?: string;
  customerPhone?: string | null;
  businessKey?: Record<string, any>;
  extra?: Record<string, any>;
}

// ── Entity Record Interfaces ─────────────────────────────────────────────────

export interface SyncUserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  isActive: boolean;
  isFirstLogin: boolean;
  signature: string | null;
  createdAt: string;
  updatedAt: string;
  _meta: SyncMeta;
}

export interface SyncPasskeyRecord {
  id: string;
  credentialID: string;
  publicKey: string; // base64 encoded bytea
  counter: number;
  deviceType: string | null;
  backedUp: boolean;
  transports: string[] | null;
  userId: string;
  _meta: SyncMeta;
}

export interface SyncCustomerRecord {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  email: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _meta: SyncMeta;
}

export interface SyncActivityLogRecord {
  id: string;
  action: string;
  module: string | null;
  recordId: string | null;
  details: any | null;
  userId: string | null;
  createdAt: string;
  _meta: SyncMeta & { userEmail?: string };
}

export interface SyncExpenseRecord {
  id: string;
  category: string;
  type: string;
  description: string | null;
  amount: number;
  date: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  _meta: SyncMeta & { userEmail?: string };
}

export interface SyncPricingSettingRecord {
  key: string;
  value: number;
  label: string;
  group: string;
  updatedAt: string;
  updatedBy: string | null;
  _meta: SyncMeta & { userEmail?: string };
}

export interface SyncMessageLogRecord {
  id: string;
  module: string;
  templateId: string | null;
  templateLabel: string | null;
  channel: string;
  recipientName: string | null;
  recipientPhone: string;
  messageBody: string;
  recordId: string | null;
  sentById: string | null;
  createdAt: string;
  _meta: SyncMeta & { userEmail?: string };
}

export interface SyncMessageTemplateRecord {
  id: string;
  label: string;
  modules: string[];
  body: string;
  createdAt: string;
  updatedAt: string;
  _meta: SyncMeta;
}

export interface SyncAffidavitRecord {
  id: string;
  customerName: string;
  phone: string | null;
  purpose: string;
  affidavitNo: string | null;
  paperType: string;
  authorizerType: string;
  authorizerName: string | null;
  dateOfService: string;
  amountCharged: number;
  notaryPublicFee: number | null;
  remark: string | null;
  customerBroughtStamp: boolean;
  customerId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _meta: SyncMeta;
}

export interface SyncMarriageRecord {
  id: string;
  contactName: string;
  phone: string | null;
  contactEmail: string | null;
  address: string | null;
  isPrimaryContactSpouse: boolean;
  primaryContactSpouseType: string | null;
  spouse1Name: string;
  spouse2Name: string;
  marriageAct: string;
  marriageDate: string;
  marriagePlace: string | null;
  appointmentDate: string | null;
  dateOfService: string;
  servicesProvided: string[];
  amountCharged: number;
  officialFee: number | null;
  courtFeeTickets: number | null;
  miscFee: number | null;
  consultancyFee: number | null;
  applicationNo: string | null;
  customerId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  affidavitIds: string[]; // M2M via marriage_affidavits
  _meta: SyncMeta;
}

export interface SyncMarriageTicketRecord {
  id: string;
  ticketNumber: string;
  contactName: string;
  phone: string | null;
  contactEmail: string | null;
  address: string | null;
  isPrimaryContactSpouse: boolean;
  primaryContactSpouseType: string | null;
  servicesProvided: string[];
  amountCharged: number;
  questionnaireData: any;
  status: string;
  marriageId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _meta: SyncMeta;
}

export interface SyncMarriagePaymentRecord {
  id: string;
  amount: number;
  paymentMode: string;
  account: string;
  paymentDate: string;
  notes: string | null;
  ticketId: string | null;
  marriageId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _meta: SyncMeta;
}

export interface SyncBirthDeathCertificateRecord {
  id: string;
  certificateType: string;
  customerName: string;
  phone: string | null;
  personName: string;
  eventDate: string;
  dateOfService: string;
  numberOfCopies: number;
  amountCharged: number;
  customerId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _meta: SyncMeta;
}

export interface SyncPropertyCardRecord {
  id: string;
  customerName: string;
  phone: string | null;
  recordType: string;
  propertyNumber: string;
  dateOfService: string;
  amountCharged: number;
  customerId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _meta: SyncMeta;
}

export interface SyncShopActLicenseRecord {
  id: string;
  customerName: string;
  phone: string | null;
  businessName: string;
  email: string | null;
  dateOfService: string;
  amountCharged: number;
  customerId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _meta: SyncMeta;
}

export interface SyncPropertyTaxRecord {
  id: string;
  serviceType: string;
  customerName: string;
  phone: string | null;
  address: string;
  propertyTaxNo: string;
  officialFee: number;
  serviceFee: number;
  protocolFee: number;
  amountCharged: number;
  dateOfService: string;
  propertyId: string | null;
  customerId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _meta: SyncMeta;
}

export interface SyncPropertyRecord {
  id: string;
  propertyTaxNo: string;
  address: string;
  status: string;
  customerId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _meta: SyncMeta;
}

export interface SyncBusinessRecord {
  id: string;
  name: string;
  licenseNo: string | null;
  tradeType: string | null;
  tradeSubtype: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  lastRenewalYear: number | null;
  completionCertificateStatus: string;
  completionCertificateSubmittedAt: string | null;
  completionCertificateVerificationStatus: string;
  completionCertificateVerifiedAt: string | null;
  isTenant: boolean;
  depositFeeCharged: boolean;
  depositFeeAmount: number;
  depositFeeCollectionDate: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  customerIds: string[]; // M2M via business_customers
  _meta: SyncMeta;
}

export interface SyncBusinessTradeRecord {
  id: string;
  businessId: string;
  tradeType: string;
  tradeSubtype: string;
  createdAt: string;
  deletedAt: string | null;
  _meta: SyncMeta;
}

export interface SyncTradeTypeConfigRecord {
  id: string;
  tradeType: string;
  tradeSubtype: string;
  licenseFee: number;
  fireFee: number;
  renewalFireFee: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _meta: SyncMeta;
}

export interface SyncTradeLicenseRecordRecord {
  id: string;
  serviceType: string;
  dateOfService: string;
  amountCharged: number;
  licenseFee: number;
  fireFee: number;
  depositFee: number;
  serviceFee: number;
  protocolFee: number | null;
  miscFee: number | null;
  tokenNo: string | null;
  details: any | null;
  businessId: string;
  createdBy: string;
  linkedAffidavitId: string | null;
  linkedPropertyCardId: string | null;
  linkedShopActId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _meta: SyncMeta;
}

export interface SyncTradeLicensePaymentRecord {
  id: string;
  amount: number;
  paymentMode: string;
  account: string;
  paymentDate: string;
  notes: string | null;
  recordId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _meta: SyncMeta;
}

export interface SyncPanCardRecord {
  id: string;
  customerName: string;
  phone: string | null;
  applicationType: string;
  ackNo: string | null;
  dateOfService: string;
  officialFee: number;
  serviceFee: number;
  amountCharged: number;
  customerId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _meta: SyncMeta;
}

export interface SyncPassportRecord {
  id: string;
  customerName: string;
  phone: string | null;
  applicationType: string;
  fileNo: string | null;
  appointmentDate: string | null;
  dateOfService: string;
  officialFee: number;
  serviceFee: number;
  amountCharged: number;
  customerId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _meta: SyncMeta;
}

export interface SyncVoterCardRecord {
  id: string;
  customerName: string;
  phone: string | null;
  applicationType: string;
  epicNo: string | null;
  tokenNo: string | null;
  dateOfService: string;
  officialFee: number;
  serviceFee: number;
  amountCharged: number;
  customerId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _meta: SyncMeta;
}

export interface SyncGazetteRecord {
  id: string;
  customerName: string;
  phone: string | null;
  oldName: string;
  newName: string;
  reasonToChangeName: string;
  tokenNo: string | null;
  dateOfService: string;
  officialFee: number;
  serviceFee: number;
  amountCharged: number;
  customerId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _meta: SyncMeta;
}

export interface SyncWaterConnectionRecord {
  id: string;
  connectionNo: string | null;
  currentOwner: string;
  connectionAddress: string;
  contactPersonName: string | null;
  contactPersonPhone: string | null;
  currentUsage: string;
  connectionStatus: string;
  meterDetails: string | null;
  customerId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _meta: SyncMeta;
}

export interface SyncWaterServiceRecordRecord {
  id: string;
  serviceType: string;
  dateOfService: string;
  applicationDate: string;
  applicationTokenNo: string | null;
  officialFee: number;
  serviceFee: number;
  protocolFee: number | null;
  miscFee: number | null;
  discount: number;
  amountCharged: number;
  remarks: string | null;
  details: any | null;
  connectionId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _meta: SyncMeta;
}

export interface SyncWaterPaymentRecord {
  id: string;
  amount: number;
  paymentMode: string;
  paymentDate: string;
  account: string;
  referenceNumber: string | null;
  notes: string | null;
  recordId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _meta: SyncMeta;
}

export interface SyncWaterDocumentRecord {
  id: string;
  documentType: string;
  fileName: string;
  remarks: string | null;
  recordId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _meta: SyncMeta;
}

export interface SyncWaterFeeConfigRecord {
  id: string;
  serviceType: string;
  officialFee: number;
  serviceFee: number;
  protocolFee: number;
  defaultMiscFee: number;
  allowManualOverride: boolean;
  effectiveDate: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _meta: SyncMeta;
}

// ── M2M Join Table Records ───────────────────────────────────────────────────

export interface SyncM2MRecord {
  table: string;
  records: Array<Record<string, string>>;
}

// ── SyncPayload (v2) ─────────────────────────────────────────────────────────

export interface SyncPayloadV2 {
  version: '2';
  exportedAt: string;
  tables: string[];
  records: {
    users?: SyncUserRecord[];
    passkeys?: SyncPasskeyRecord[];
    customers?: SyncCustomerRecord[];
    activity_logs?: SyncActivityLogRecord[];
    expenses?: SyncExpenseRecord[];
    pricing_settings?: SyncPricingSettingRecord[];
    message_logs?: SyncMessageLogRecord[];
    affidavits?: SyncAffidavitRecord[];
    marriages?: SyncMarriageRecord[];
    marriage_tickets?: SyncMarriageTicketRecord[];
    marriage_payments?: SyncMarriagePaymentRecord[];
    birth_death_certificates?: SyncBirthDeathCertificateRecord[];
    property_cards?: SyncPropertyCardRecord[];
    shop_act_licenses?: SyncShopActLicenseRecord[];
    properties?: SyncPropertyRecord[];
    property_tax_records?: SyncPropertyTaxRecord[];
    businesses?: SyncBusinessRecord[];
    business_trades?: SyncBusinessTradeRecord[];
    trade_type_configs?: SyncTradeTypeConfigRecord[];
    trade_license_records?: SyncTradeLicenseRecordRecord[];
    trade_license_payments?: SyncTradeLicensePaymentRecord[];
    pan_card_records?: SyncPanCardRecord[];
    passport_records?: SyncPassportRecord[];
    voter_card_records?: SyncVoterCardRecord[];
    gazettes?: SyncGazetteRecord[];
    water_connections?: SyncWaterConnectionRecord[];
    water_service_records?: SyncWaterServiceRecordRecord[];
    water_payments?: SyncWaterPaymentRecord[];
    water_documents?: SyncWaterDocumentRecord[];
    water_fee_configs?: SyncWaterFeeConfigRecord[];
    message_templates?: SyncMessageTemplateRecord[];
  };
  m2m?: SyncM2MRecord[];
}

// ── Table Constants ──────────────────────────────────────────────────────────

export const ALL_SYNC_TABLES = [
  'users',
  'passkeys',
  'customers',
  'activity_logs',
  'expenses',
  'pricing_settings',
  'message_logs',
  'affidavits',
  'marriages',
  'marriage_tickets',
  'marriage_payments',
  'birth_death_certificates',
  'property_cards',
  'shop_act_licenses',
  'properties',
  'property_tax_records',
  'businesses',
  'business_trades',
  'trade_type_configs',
  'trade_license_records',
  'trade_license_payments',
  'pan_card_records',
  'passport_records',
  'voter_card_records',
  'gazettes',
  'water_connections',
  'water_service_records',
  'water_payments',
  'water_documents',
  'water_fee_configs',
  'message_templates',
] as const;

export type SyncTableName = (typeof ALL_SYNC_TABLES)[number];

export const M2M_TABLES = ['business_customers', 'marriage_affidavits'] as const;

// ── Topological Import Order (lowest index = imported first) ──────────────────

export const IMPORT_ORDER: ReadonlyArray<string> = [
  // Level 0: zero FK dependencies
  'users',
  'customers',
  'trade_type_configs',
  'water_fee_configs',
  // Level 1: depend only on Level 0
  'passkeys',
  'activity_logs',
  'message_logs',
  'message_templates',
  'expenses',
  'pricing_settings',
  'affidavits',
  'birth_death_certificates',
  'gazettes',
  'property_cards',
  'properties',
  'property_tax_records',
  'shop_act_licenses',
  'pan_card_records',
  'voter_card_records',
  'passport_records',
  'businesses',
  'water_connections',
  // Level 2: depend on Level 0 + Level 1
  'business_trades',
  'marriages',
  'marriage_tickets',
  'water_service_records',
  'trade_license_records',
  // Level 3: depend on Level 2
  'marriage_payments',
  'water_payments',
  'water_documents',
  'trade_license_payments',
];

// ── Business Key Definitions ──────────────────────────────────────────────────

export const BUSINESS_KEYS: Record<string, string[]> = {
  users: ['email'],
  customers: ['phone'],
  passkeys: ['credentialID'],
  marriages: ['spouse1Name', 'spouse2Name', 'dateOfService'],
  marriage_tickets: ['ticketNumber'],
  trade_type_configs: ['tradeType', 'tradeSubtype'],
  water_fee_configs: ['serviceType'],
  water_connections: ['connectionNo'],
  water_service_records: ['applicationTokenNo'],
};

// ── Result Interfaces ────────────────────────────────────────────────────────

export interface SyncPreviewRow {
  table: string;
  toInsert: number;
  alreadyExist: number;
  errors: string[];
}

export interface SyncPreviewResult {
  valid: boolean;
  summary: SyncPreviewRow[];
  totalNew: number;
  totalSkipped: number;
  totalErrors: number;
}

export interface SyncImportResult {
  inserted: number;
  skipped: number;
  errors: string[];
  details: { table: string; inserted: number; skipped: number }[];
}
