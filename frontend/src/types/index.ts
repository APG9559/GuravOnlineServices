export type Role = 'admin' | 'operator';
export type PaperType = 'stamp500' | 'Plain';
export type AuthorizerType = 'magistrate' | 'Notary';
export type MarriageAct =
  | 'Hindu Marriage Act'
  | 'Muslim Personal Law (Shariat)'
  | 'Indian Christian Marriage Act';
export type CertificateType = 'Birth' | 'Death';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isFirstLogin: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string | null;
  email?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerServiceUsage {
  id: string;
  type: 'affidavit' | 'marriage' | 'birth-death' | 'property-card' | 'shop-act' | 'gazette' | 'trade-license' | 'pan-card' | 'passport';
  typeName: string;
  dateOfService: string;
  amountCharged: number;
  description: string;
  createdBy: string;
  createdAt: string;
}

export interface CustomerDetails extends Customer {
  services: CustomerServiceUsage[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface Affidavit {
  id: string;
  customerName: string;
  phone: string;
  purpose: string;
  paperType: PaperType;
  authorizerType: AuthorizerType;
  authorizerName?: string;
  dateOfService: string;
  amountCharged: number;
  notaryPublicFee?: number | null;
  remark?: string | null;
  customerBroughtStamp?: boolean;
  createdBy: AuthUser;
  customer?: Customer | null;
  createdAt: string;
  updatedAt: string;
}

export interface Marriage {
  id: string;
  contactName: string;
  phone: string;
  contactEmail?: string;
  address?: string;
  spouse1Name: string;
  spouse2Name: string;
  marriageAct: MarriageAct;
  marriageDate: string;
  marriagePlace?: string;
  appointmentDate?: string;
  affidavitDates?: Record<string, string>;
  dateOfService: string;
  servicesProvided: string[];
  affidavits?: Affidavit[];
  affidavitIds?: string[];
  amountCharged: number;
  createdBy: AuthUser;
  customer?: Customer | null;
  createdAt: string;
  updatedAt: string;
}

// ── Marriage Tickets ──────────────────────────────────────────────────────────
export type TicketStatus = 'Inquired' | 'Confirmed' | 'Completed';

export interface ProofEntry {
  correct: boolean;
  affidavit?: 'Yes' | 'No' | 'Combined with other';
  paperType?: PaperType;
  authorizer?: AuthorizerType;
  amountCharged?: number;
  remark?: string;
  customerBroughtStamp?: boolean;
}

export interface QuestionnaireData {
  husband: {
    birthDateProof: ProofEntry;
    residenceProof: ProofEntry;
    identityProof: ProofEntry;
  };
  wife: {
    birthDateProof: ProofEntry;
    residenceProof: ProofEntry;
    identityProof: ProofEntry;
  };
  weddingInvitation: {
    available: boolean;
    affidavit?: 'Yes' | 'No' | 'Combined with other';
    paperType?: PaperType;
    authorizer?: AuthorizerType;
    amountCharged?: number;
    remark?: string;
    customerBroughtStamp?: boolean;
  };
  firstMarriage: {
    yes: boolean;
    affidavit?: 'Yes' | 'No' | 'Combined with other';
    paperType?: PaperType;
    authorizer?: AuthorizerType;
    amountCharged?: number;
    remark?: string;
    customerName?: string;
    customerBroughtStamp?: boolean;
  };
  intercasteMarriage: {
    yes: boolean;
    affidavit?: 'Yes' | 'No' | 'Combined with other';
    paperType?: PaperType;
    authorizer?: AuthorizerType;
    amountCharged?: number;
    remark?: string;
    customerBroughtStamp?: boolean;
  };
  notRegisteredAnywhereElse?: {
    yes: boolean;
    affidavit?: 'Yes' | 'No' | 'Combined with other';
    paperType?: PaperType;
    authorizer?: AuthorizerType;
    amountCharged?: number;
    remark?: string;
    customerBroughtStamp?: boolean;
  };
  consultancyFee?: {
    amountCharged?: number;
    included?: boolean;
  };
}

export interface MarriageTicket {
  id: string;
  ticketNumber: string;
  contactName: string;
  phone: string;
  contactEmail?: string;
  address?: string;
  servicesProvided: string[];
  amountCharged: number;
  questionnaireData: QuestionnaireData;
  status: TicketStatus;
  marriage?: Marriage | null;
  createdBy: AuthUser;
  createdAt: string;
  updatedAt: string;
}

export interface BirthDeathCertificate {
  id: string;
  certificateType: CertificateType;
  customerName: string;
  phone: string;
  personName: string;
  eventDate: string;
  dateOfService: string;
  numberOfCopies: number;
  amountCharged: number;
  createdBy: AuthUser;
  customer?: Customer | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardModuleSubService {
  label: string;
  grossEarnings: number;
  netEarnings: number;
  count: number;
}

export interface DashboardModule {
  label: string;
  grossEarnings: number;
  netEarnings: number;
  count: number;
  subServices: Record<string, DashboardModuleSubService>;
}

export interface DailyEarningPoint {
  date: string;
  affidavits: number;
  marriages: number;
  birthDeath: number;
  propertyCards: number;
  shopAct: number;
  tradeLicenses: number;
  panCards: number;
  passports: number;
  gazettes: number;
  kmc: number;
  csc: number;
  aapleSarkar: number;
  total: number;
}

export interface DashboardSummary {
  fromDate: string;
  toDate: string;
  affidavitCount: number;
  marriageCount: number;
  birthDeathCount: number;
  propertyCardCount: number;
  shopActLicenseCount: number;
  tradeLicenseCount: number;
  panCardCount: number;
  passportCount: number;
  gazetteCount: number;
  affidavitEarnings: number;
  affidavitGrossEarnings: number;
  affidavitNetEarnings: number;
  marriageEarnings: number;
  birthDeathEarnings: number;
  propertyCardEarnings: number;
  shopActLicenseEarnings: number;
  tradeLicenseEarnings: number;
  tradeLicenseNetEarnings: number;
  panCardEarnings: number;
  passportEarnings: number;
  gazetteEarnings: number;
  gazetteNetEarnings: number;
  totalEarnings: number;
  totalNetEarnings: number;
  modules: {
    kmc: DashboardModule;
    csc: DashboardModule;
    aapleSarkar: DashboardModule;
  };
  breakdown: {
    byAct: Record<string, number>;
    byAuthorizer: Record<string, number>;
    byPaper: Record<string, number>;
    byType: Record<string, number>;
    byCardType: Record<string, number>;
  };
  dailyEarnings?: DailyEarningPoint[];
}

// ── Pricing / Settings ────────────────────────────────────────────────────────
export interface PricingSetting {
  key: string;
  value: number;
  label: string;
  group: string;
  updatedAt: string;
  updatedBy: AuthUser | null;
}

// Flat map returned by /settings/pricing/map
export type PricingMap = Record<string, number>;

// Fallback defaults (used while API data loads)
export const DEFAULT_PRICING_MAP: PricingMap = {
  magistrate_fee: 850,
  notary_fee: 1100,
  stamp500_cost: 500,
  plain_cost: 0,
  online_form: 300,
  offline_form: 300,
  true_copy: 100,
  marriage_consultancy_fee: 500,
  birth_death_first_copy: 300,
  birth_death_extra_copy: 50,
  property_card_fee: 100,
  seven_twelve_fee: 100,
  eight_a_fee: 100,
  shop_act_license_fee: 500,
  trade_license_new_service_fee: 300,
  trade_license_renew_service_fee: 200,
  trade_license_transfer_heir_service_fee: 250,
  trade_license_transfer_third_party_service_fee: 300,
  trade_license_name_change_service_fee: 150,
  trade_license_trade_change_service_fee: 200,
  trade_license_partner_change_service_fee: 150,
  trade_license_cancel_service_fee: 100,
  trade_license_link_affidavit_fee: 100,
  trade_license_link_property_card_fee: 100,
  trade_license_link_shop_act_fee: 100,
  trade_license_protocol_fee: 100,
  csc_pan_card_new_fee: 200,
  csc_pan_card_correction_fee: 150,
  csc_pan_card_reprint_fee: 120,
  csc_passport_fresh_fee: 400,
  csc_passport_reissue_fee: 350,
  gazette_official_fee: 500,
  gazette_service_fee: 150,
};

export interface TradeTypeConfig {
  id: string;
  tradeType: string;
  tradeSubtype: string;
  officialFee: number;
  createdAt: string;
  updatedAt: string;
}

export interface Business {
  id: string;
  name: string;
  licenseNo?: string | null;
  tradeType?: string | null;
  tradeSubtype?: string | null;
  email?: string | null;
  phone?: string | null;
  status: 'Pending' | 'Approved' | 'Cancelled';
  lastRenewalYear?: number | null;
  customers?: Customer[];
  createdAt: string;
  updatedAt: string;
}

export interface TradeLicenseRecord {
  id: string;
  serviceType: 'New' | 'Renew' | 'Transfer_Heir' | 'Transfer_Third_Party' | 'Name_Change' | 'Trade_Change' | 'Partner_Change' | 'Cancel';
  dateOfService: string;
  amountCharged: number;
  officialFee: number;
  serviceFee: number;
  protocolFee?: number | null;
  miscFee?: number | null;
  tokenNo?: string | null;
  details?: any;
  business?: Business;
  createdBy: AuthUser;
  linkedAffidavit?: Affidavit | null;
  linkedPropertyCard?: PropertyCard | null;
  linkedShopAct?: ShopActLicense | null;
  createdAt: string;
  updatedAt: string;
}

export const PAPER_LABELS: Record<PaperType, string> = {
  stamp500: '₹500 Stamp Paper',
  Plain: 'Plain Paper',
};

export const AUTH_LABELS: Record<AuthorizerType, string> = {
  magistrate: 'Executive Magistrate',
  Notary: 'Notary Public',
};

export const CERT_TYPE_LABELS: Record<CertificateType, string> = {
  Birth: 'Birth Certificate',
  Death: 'Death Certificate',
};


export type PropertyCardType = 'Property Card' | '7/12 Card' | '8A';

export interface PropertyCard {
  id: string;
  customerName: string;
  phone: string;
  recordType: PropertyCardType;
  propertyNumber: string;
  dateOfService: string;
  amountCharged: number;
  createdBy: AuthUser;
  customer?: Customer | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShopActLicense {
  id: string;
  customerName: string;
  phone: string;
  businessName: string;
  email?: string;
  dateOfService: string;
  amountCharged: number;
  createdBy: AuthUser;
  customer?: Customer | null;
  createdAt: string;
  updatedAt: string;
}

export const PROPERTY_CARD_TYPE_LABELS: Record<PropertyCardType, string> = {
  'Property Card': 'Property Card',
  '7/12 Card': '7/12 Card',
  '8A': '8A',
};

export interface PanCardRecord {
  id: string;
  customerName: string;
  phone: string;
  applicationType: 'New' | 'Correction' | 'Reprint';
  ackNo?: string | null;
  dateOfService: string;
  officialFee: number;
  serviceFee: number;
  amountCharged: number;
  customer?: Customer | null;
  createdBy: AuthUser;
  createdAt: string;
  updatedAt: string;
}

export interface PassportRecord {
  id: string;
  customerName: string;
  phone: string;
  applicationType: 'Fresh' | 'Re-issue';
  fileNo?: string | null;
  appointmentDate?: string | null;
  dateOfService: string;
  officialFee: number;
  serviceFee: number;
  amountCharged: number;
  customer?: Customer | null;
  createdBy: AuthUser;
  createdAt: string;
  updatedAt: string;
}

export interface Gazette {
  id: string;
  customerName: string;
  phone: string;
  oldName: string;
  newName: string;
  reasonToChangeName: string;
  dateOfService: string;
  officialFee: number;
  serviceFee: number;
  amountCharged: number;
  customer?: Customer | null;
  createdBy: AuthUser;
  createdAt: string;
  updatedAt: string;
}

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  New: 'New Trade License',
  Renew: 'Renew Trade License',
  Transfer_Heir: 'Transfer to Heir',
  Transfer_Third_Party: 'Transfer to Third Party',
  Name_Change: 'Business Name Change',
  Trade_Change: 'Trade Activity Change',
  Partner_Change: 'Partner Amendment',
  Cancel: 'Cancel Trade License',
};

