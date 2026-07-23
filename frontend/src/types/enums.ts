export type PaperType = 'stamp500' | 'Plain';
export type AuthorizerType = 'magistrate' | 'Notary';
export type MarriageAct =
  'Hindu Marriage Act' | 'Muslim Personal Law (Shariat)' | 'Indian Christian Marriage Act';
export type CertificateType = 'Birth' | 'Death';
export type SubTab =
  | 'affidavits'
  | 'marriages'
  | 'birthDeath'
  | 'tradeLicenses'
  | 'panCards'
  | 'passports'
  | 'voterCards'
  | 'propertyCards'
  | 'shopAct'
  | 'gazettes'
  | 'waterSupplies'
  | 'propertyTaxes';

export type TicketStatus = 'Inquired' | 'Confirmed' | 'Completed' | 'Failed';

export interface ProofEntry {
  correct: boolean;
  affidavit?: 'Yes' | 'No' | 'Combined with other';
  paperType?: PaperType;
  authorizer?: AuthorizerType;
  amountCharged?: number;
  remark?: string;
  customerBroughtStamp?: boolean;
  customerName?: string;
}

export interface QuestionnaireData {
  husband?: {
    birthDateProof?: ProofEntry;
    residenceProof?: ProofEntry;
    identityProof?: ProofEntry;
  };
  wife?: {
    birthDateProof?: ProofEntry;
    residenceProof?: ProofEntry;
    identityProof?: ProofEntry;
  };
  weddingInvitation?: {
    available?: boolean;
    affidavit?: 'Yes' | 'No' | 'Combined with other';
    paperType?: PaperType;
    authorizer?: AuthorizerType;
    amountCharged?: number;
    remark?: string;
    customerBroughtStamp?: boolean;
  };
  firstMarriage?: {
    yes?: boolean;
    affidavit?: 'Yes' | 'No' | 'Combined with other';
    paperType?: PaperType;
    authorizer?: AuthorizerType;
    amountCharged?: number;
    remark?: string;
    customerName?: string;
    customerBroughtStamp?: boolean;
  };
  intercasteMarriage?: {
    yes?: boolean;
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
  officialFee?: {
    duration: 'Upto 3 months' | '3 - 12 months' | 'After 12 months';
    amountCharged?: number;
    included?: boolean;
  };
  courtFeeTickets?: {
    amountCharged?: number;
    included?: boolean;
  };
  miscFee?: {
    amountCharged?: number;
    included?: boolean;
  };
  affidavitsPaidSeparately?: boolean;
  spouse1Name?: string;
  spouse2Name?: string;
  marriageAct?: string;
  marriageDate?: string;
  marriagePlace?: string;
  appointmentDate?: string;
  affidavitDates?: Record<string, string>;
  applicationNo?: string;
}

export type PaymentMode = 'Cash' | 'UPI' | 'Bank Transfer';

export type PropertyCardType = 'Property Card' | '7/12 Card' | '8A';

// ── Dashboard Statistics Types ────────────────────────────────────────────────
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
  voterCards: number;
  gazettes: number;
  waterSupply: number;
  propertyTax: number;
  kmc: number;
  csc: number;
  aapleSarkar: number;
  expenses: number;
  total: number;
}

export interface DashboardSummary {
  fromDate: string;
  toDate: string;
  totalEarnings: number;
  totalNetEarnings: number;
  totalExpenses: number;
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
  dailyEarnings: DailyEarningPoint[];
  userBreakdown: {
    userId: string;
    userName: string;
    gross: number;
    net: number;
    expenses: number;
  }[];
}
