export type PaperType = "stamp500" | "Plain";
export type AuthorizerType = "magistrate" | "Notary";
export type MarriageAct =
  | "Hindu Marriage Act"
  | "Muslim Personal Law (Shariat)"
  | "Indian Christian Marriage Act";
export type CertificateType = "Birth" | "Death";
export type SubTab =
  | "affidavits"
  | "marriages"
  | "birthDeath"
  | "tradeLicenses"
  | "panCards"
  | "passports"
  | "voterCards"
  | "propertyCards"
  | "shopAct"
  | "gazettes"
  | "waterSupplies"
  | "propertyTaxes";

export type TicketStatus = "Inquired" | "Confirmed" | "Completed";

export interface ProofEntry {
  correct: boolean;
  affidavit?: "Yes" | "No" | "Combined with other";
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
    affidavit?: "Yes" | "No" | "Combined with other";
    paperType?: PaperType;
    authorizer?: AuthorizerType;
    amountCharged?: number;
    remark?: string;
    customerBroughtStamp?: boolean;
  };
  firstMarriage: {
    yes: boolean;
    affidavit?: "Yes" | "No" | "Combined with other";
    paperType?: PaperType;
    authorizer?: AuthorizerType;
    amountCharged?: number;
    remark?: string;
    customerName?: string;
    customerBroughtStamp?: boolean;
  };
  intercasteMarriage: {
    yes: boolean;
    affidavit?: "Yes" | "No" | "Combined with other";
    paperType?: PaperType;
    authorizer?: AuthorizerType;
    amountCharged?: number;
    remark?: string;
    customerBroughtStamp?: boolean;
  };
  notRegisteredAnywhereElse?: {
    yes: boolean;
    affidavit?: "Yes" | "No" | "Combined with other";
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
    duration: "Upto 3 months" | "3 - 12 months" | "After 12 months";
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

export const PAYMENT_MODES = ["Cash", "UPI", "Bank Transfer"] as const;

export type PaymentMode = (typeof PAYMENT_MODES)[number];

export const PAYMENT_ACCOUNTS_BY_MODE: Record<PaymentMode, readonly string[]> =
  {
    Cash: ["Main Cashbox", "Ashish Cashbox"],
    UPI: [
      "Vaishali Gurav Saraswat Bank",
      "Ashish Gurav SBI",
      "Parshuram Gurav",
      "Gauri Gurav",
      "Other",
    ],
    "Bank Transfer": [
      "Vaishali Gurav Saraswat Bank",
      "Vaishali Gurav Maha. Bank",
      "Ashish Gurav SBI",
      "Ashish Gurav Maha. Bank",
      "Other",
    ],
  } as const;

export const ALL_PAYMENT_ACCOUNTS = [
  ...new Set(
    Object.values(PAYMENT_ACCOUNTS_BY_MODE)
      .flat()
      .filter((a) => a !== "Other"),
  ),
] as string[];

export const PAPER_LABELS: Record<PaperType, string> = {
  stamp500: "₹500 Stamp Paper",
  Plain: "Plain Paper",
};

export const AUTH_LABELS: Record<AuthorizerType, string> = {
  magistrate: "Executive Magistrate",
  Notary: "Notary Public",
};

export const CERT_TYPE_LABELS: Record<CertificateType, string> = {
  Birth: "Birth Certificate",
  Death: "Death Certificate",
};

export type PropertyCardType = "Property Card" | "7/12 Card" | "8A";

export const PROPERTY_CARD_TYPE_LABELS: Record<PropertyCardType, string> = {
  "Property Card": "Property Card",
  "7/12 Card": "7/12 Card",
  "8A": "8A",
};

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  New: "New Trade License",
  Renew: "Renew Trade License",
  Transfer_Heir: "Transfer to Heir",
  Transfer_Third_Party: "Transfer to Third Party",
  Name_Change: "Business Name Change",
  Trade_Change: "Trade Activity Change",
  Partner_Change: "Partner Amendment",
  Cancel: "Cancel Trade License",
};

export const WATER_SERVICE_TYPE_LABELS: Record<string, string> = {
  NewConnection: "New Connection",
  ConnectionTransfer: "Connection Transfer",
  MeterDisconnection: "Water Meter Disconnection",
  MeterReconnection: "Water Meter Reconnection",
  NoDuesCertificate: "Water Meter No Dues Certificate",
  MeterInspection: "Water Meter Inspection",
  ChangeOfUse: "Water Meter Change of Use",
};

export const PROPERTY_TAX_SERVICE_TYPE_LABELS: Record<string, string> = {
  AssessmentCopy: "Assessment Copy",
  NameTransfer: "Property Tax Name Transfer",
  NoDuesCertificate: "Property Tax No Dues Certificate",
};

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
