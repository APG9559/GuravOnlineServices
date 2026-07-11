import { AuthUser, User } from './auth';
import { Customer } from './customer';
import {
  PaperType,
  AuthorizerType,
  MarriageAct,
  CertificateType,
  TicketStatus,
  QuestionnaireData,
  PropertyCardType,
  SubTab,
} from './enums';

export interface Affidavit {
  id: string;
  customerName: string;
  phone: string;
  purpose: string;
  affidavitNo?: string | null;
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

export interface MarriagePayment {
  id: string;
  amount: number;
  paymentMode: string;
  account: string;
  paymentDate: string;
  notes?: string | null;
  createdBy: AuthUser;
  createdAt: string;
}

export interface Marriage {
  id: string;
  payments?: MarriagePayment[];
  contactName: string;
  phone: string;
  contactEmail?: string;
  address?: string;
  isPrimaryContactSpouse?: boolean;
  primaryContactSpouseType?: "husband" | "wife" | null;
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
  officialFee?: number;
  courtFeeTickets?: number;
  miscFee?: number;
  consultancyFee?: number;
  applicationNo?: string;
  createdBy: AuthUser;
  customer?: Customer | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarriageTicket {
  id: string;
  payments?: MarriagePayment[];
  ticketNumber: string;
  contactName: string;
  phone: string;
  contactEmail?: string;
  address?: string;
  isPrimaryContactSpouse?: boolean;
  primaryContactSpouseType?: "husband" | "wife" | null;
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

export interface TradeTypeConfig {
  id: string;
  tradeType: string;
  tradeSubtype: string;
  licenseFee: number;
  fireFee?: number;
  renewalFireFee?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessTrade {
  id: string;
  tradeType: string;
  tradeSubtype: string;
  createdAt?: string;
}

export interface Business {
  id: string;
  name: string;
  licenseNo?: string | null;
  tradeType?: string | null;
  tradeSubtype?: string | null;
  trades?: BusinessTrade[];
  email?: string | null;
  phone?: string | null;
  status: "Pending" | "Approved" | "Cancelled";
  lastRenewalYear?: number | null;
  completionCertificateStatus: 'Available' | 'Not Available';
  completionCertificateSubmittedAt?: string | null;
  completionCertificateVerificationStatus: 'Not_Submitted' | 'Pending' | 'Verified' | 'Rejected';
  completionCertificateVerifiedAt?: string | null;
  isTenant: boolean;
  depositFeeCharged: boolean;
  depositFeeAmount: number;
  depositFeeCollectionDate?: string | null;
  customers?: Customer[];
  createdAt: string;
  updatedAt: string;
}

export interface TradeLicensePayment {
  id: string;
  amount: number;
  paymentMode: string;
  account: string;
  paymentDate: string;
  notes?: string | null;
  record?: TradeLicenseRecord;
  createdBy: AuthUser;
  createdAt: string;
}

export interface TradeLicenseRecord {
  id: string;
  serviceType:
    | "New"
    | "Renew"
    | "Transfer_Heir"
    | "Transfer_Third_Party"
    | "Name_Change"
    | "Trade_Change"
    | "Partner_Change"
    | "Cancel";
  dateOfService: string;
  amountCharged: number;
  licenseFee: number;
  fireFee?: number | null;
  serviceFee: number;
  protocolFee?: number | null;
  miscFee?: number | null;
  tokenNo?: string | null;
  details?: any;
  business?: Business;
  payments?: TradeLicensePayment[];
  createdBy: AuthUser;
  linkedAffidavit?: Affidavit | null;
  linkedPropertyCard?: PropertyCard | null;
  linkedShopAct?: ShopActLicense | null;
  createdAt: string;
  updatedAt: string;
}

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

export interface PanCardRecord {
  id: string;
  customerName: string;
  phone: string;
  applicationType: "New" | "Correction" | "Reprint";
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
  applicationType: "Fresh" | "Re-issue";
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

export interface VoterCardRecord {
  id: string;
  customerName: string;
  phone: string;
  applicationType: "New" | "Correction" | "Name Deletion" | "Address Change";
  epicNo?: string | null;
  tokenNo?: string | null;
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
  tokenNo?: string | null;
  dateOfService: string;
  officialFee: number;
  serviceFee: number;
  amountCharged: number;
  customer?: Customer | null;
  createdBy: AuthUser;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  category: "Shop" | "Home";
  type: string;
  description: string | null;
  amount: number;
  date: string;
  user: User;
  createdAt: string;
  updatedAt: string;
}

export interface WaterConnection {
  id: string;
  connectionNo?: string | null;
  currentOwner: string;
  customer?: Customer | null;
  connectionAddress: string;
  contactPersonName?: string | null;
  contactPersonPhone?: string | null;
  currentUsage: string;
  connectionStatus: 'Pending' | 'Active' | 'Disconnected' | 'Cancelled';
  meterDetails?: string | null;
  createdBy: AuthUser;
  createdAt: string;
  updatedAt: string;
}

export interface WaterPayment {
  id: string;
  amount: number;
  paymentMode: string;
  paymentDate: string;
  account: string;
  referenceNumber?: string | null;
  notes?: string | null;
  createdBy: AuthUser;
  createdAt: string;
}

export interface WaterDocument {
  id: string;
  documentType: string;
  fileName: string;
  remarks?: string | null;
  createdBy: AuthUser;
  createdAt: string;
}

export interface WaterFeeConfig {
  id: string;
  serviceType: string;
  officialFee: number;
  serviceFee: number;
  protocolFee: number;
  defaultMiscFee: number;
  allowManualOverride: boolean;
  effectiveDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WaterServiceRecord {
  id: string;
  serviceType:
    | "NewConnection"
    | "ConnectionTransfer"
    | "MeterDisconnection"
    | "MeterReconnection"
    | "ChangeOfUse"
    | "MeterInspection"
    | "NoDuesCertificate";
  dateOfService: string;
  applicationDate: string;
  applicationTokenNo?: string | null;
  officialFee: number;
  serviceFee: number;
  protocolFee?: number | null;
  miscFee?: number | null;
  discount: number;
  amountCharged: number;
  remarks?: string | null;
  details?: any;
  connection: WaterConnection;
  payments?: WaterPayment[];
  documents?: WaterDocument[];
  createdBy: AuthUser;
  createdAt: string;
  updatedAt: string;
}

export type WaterSupply = WaterServiceRecord;

export interface PropertyTax {
  id: string;
  serviceType: "AssessmentCopy" | "NameTransfer" | "NoDuesCertificate";
  customerName: string;
  phone: string;
  address: string;
  propertyTaxNo: string;
  officialFee: number;
  serviceFee: number;
  protocolFee: number;
  amountCharged: number;
  dateOfService: string;
  customer?: Customer | null;
  createdBy: AuthUser;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  module: string;
  recordId?: string | null;
  details?: any;
  user: User | null;
  createdAt: string;
}

export interface RecordTypeMap {
  affidavits: Affidavit;
  marriages: Marriage;
  birthDeath: BirthDeathCertificate;
  tradeLicenses: TradeLicenseRecord;
  panCards: PanCardRecord;
  passports: PassportRecord;
  voterCards: VoterCardRecord;
  propertyCards: PropertyCard;
  shopAct: ShopActLicense;
  gazettes: Gazette;
  waterSupplies: WaterSupply;
  propertyTaxes: PropertyTax;
}

export type RecordTypeBySubTab<T extends SubTab> = RecordTypeMap[T];

export interface MessageTemplate {
  id: string;
  label: string;
  modules: string[];
  body: string;
  createdAt: string;
  updatedAt: string;
}
