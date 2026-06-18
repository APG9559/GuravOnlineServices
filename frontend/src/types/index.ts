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
  type: 'affidavit' | 'marriage' | 'birth-death' | 'property-card' | 'shop-act';
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
  };
  firstMarriage: {
    yes: boolean;
    affidavit?: 'Yes' | 'No' | 'Combined with other';
    paperType?: PaperType;
    authorizer?: AuthorizerType;
    amountCharged?: number;
  };
  intercasteMarriage: {
    yes: boolean;
    affidavit?: 'Yes' | 'No' | 'Combined with other';
    paperType?: PaperType;
    authorizer?: AuthorizerType;
    amountCharged?: number;
  };
  consultancyFee?: {
    amountCharged?: number;
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

export interface DashboardSummary {
  affidavitCount: number;
  marriageCount: number;
  birthDeathCount: number;
  propertyCardCount: number;
  shopActLicenseCount: number;
  affidavitEarnings: number;
  affidavitGrossEarnings: number;
  affidavitNetEarnings: number;
  marriageEarnings: number;
  birthDeathEarnings: number;
  propertyCardEarnings: number;
  shopActLicenseEarnings: number;
  totalEarnings: number;
  totalNetEarnings: number;
  breakdown: {
    byAct: Record<string, number>;
    byAuthorizer: Record<string, number>;
    byPaper: Record<string, number>;
    byType: Record<string, number>;
    byCardType: Record<string, number>;
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
  marriage_consultancy_fee: 500,
  birth_death_first_copy: 300,
  birth_death_extra_copy: 50,
  property_card_fee: 100,
  seven_twelve_fee: 100,
  shop_act_license_fee: 500,
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


export type PropertyCardType = 'Property Card' | '7/12 Card';

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
};
