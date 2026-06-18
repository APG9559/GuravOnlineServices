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
  createdBy: AuthUser;
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
  witness1Name?: string;
  witness2Name?: string;
  witness3Name?: string;
  priestDetails?: string;
  dateOfService: string;
  servicesProvided: string[];
  affidavits?: Affidavit[];
  affidavitIds?: string[];
  amountCharged: number;
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
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  affidavitCount: number;
  marriageCount: number;
  birthDeathCount: number;
  affidavitEarnings: number;
  affidavitGrossEarnings: number;
  affidavitNetEarnings: number;
  marriageEarnings: number;
  birthDeathEarnings: number;
  totalEarnings: number;
  totalNetEarnings: number;
  breakdown: {
    byAct: Record<string, number>;
    byAuthorizer: Record<string, number>;
    byPaper: Record<string, number>;
    byType: Record<string, number>;
  };
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
  birth_death_first_copy: 300,
  birth_death_extra_copy: 50,
};

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

