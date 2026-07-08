import { api, createCrudApi } from './client';
import {
  Affidavit,
  Marriage,
  MarriageTicket,
  MarriagePayment,
  BirthDeathCertificate,
  PropertyCard,
  ShopActLicense,
  TradeTypeConfig,
  TradeLicenseRecord,
  TradeLicensePayment,
  Business,
  PanCardRecord,
  PassportRecord,
  VoterCardRecord,
  Gazette,
  WaterSupply,
  PropertyTax,
} from '@/types';

// ── Aaple Sarkar Services ──
export const affidavitsApi = createCrudApi<Affidavit>('/affidavits');
export const propertyCardsApi = createCrudApi<PropertyCard>('/property-cards');
export const shopActLicensesApi = createCrudApi<ShopActLicense>('/shop-act-licenses');
export const gazettesApi = createCrudApi<Gazette>('/gazettes');
export const voterCardsApi = createCrudApi<VoterCardRecord>('/csc-services/voter-cards');

// ── KMC Services ──
export const marriagesApi = {
  ...createCrudApi<Marriage>('/marriages'),
  createTicket: (data: unknown) => api.post<MarriageTicket>('/marriages/tickets', data),
  updateTicket: (id: string, data: unknown) => api.put<MarriageTicket>(`/marriages/tickets/${id}`, data),
  confirmTicket: (id: string, data?: unknown) => api.post<MarriageTicket>(`/marriages/tickets/${id}/confirm`, data),
  getAllTickets: (params?: Record<string, string>) =>
    api.get<MarriageTicket[]>('/marriages/tickets', { params }),
  getTicketById: (id: string) => api.get<MarriageTicket>(`/marriages/tickets/${id}`),
  addPayment: (data: unknown) => api.post('/marriages/payments', data),
  deletePayment: (id: string) => api.delete(`/marriages/payments/${id}`),
  getAllPayments: (params?: Record<string, string>) =>
    api.get<MarriagePayment[]>('/marriages/payments', { params }),
};

export const birthDeathApi = createCrudApi<BirthDeathCertificate>('/birth-death-certificates');

export const tradeLicensesApi = {
  getConfigs: () => api.get<TradeTypeConfig[]>('/trade-licenses/configs'),
  createConfig: (data: unknown) => api.post<TradeTypeConfig>('/trade-licenses/configs', data),
  updateConfig: (id: string, data: unknown) => api.put<TradeTypeConfig>(`/trade-licenses/configs/${id}`, data),
  deleteConfig: (id: string) => api.delete(`/trade-licenses/configs/${id}`),

  ...createCrudApi<TradeLicenseRecord>('/trade-licenses'),

  getAllBusinesses: (params?: Record<string, string>) =>
    api.get<Business[]>('/trade-licenses/businesses', { params }),
  getBusinessDetails: (id: string) => api.get<any>(`/trade-licenses/businesses/${id}`),
  getRenewalQueue: () => api.get<Business[]>('/trade-licenses/businesses/renewal-queue'),
  approveApplication: (id: string, licenseNo: string) =>
    api.patch<TradeLicenseRecord>(`/trade-licenses/${id}/approve`, { licenseNo }),
  updateCompletionCertificate: (id: string, data: { status: string; verificationStatus: string; submittedAt?: string; verifiedAt?: string }) =>
    api.patch<Business>(`/trade-licenses/businesses/${id}/completion-certificate`, data),

  // Payments
  addPayment: (recordId: string, data: unknown) =>
    api.post<TradeLicensePayment>(`/trade-licenses/records/${recordId}/payments`, data),
  deletePayment: (id: string) => api.delete(`/trade-licenses/payments/${id}`),
  getAllPayments: (params?: Record<string, string>) =>
    api.get<TradeLicensePayment[]>('/trade-licenses/payments', { params }),

  // Data Migration
  migrateTrades: () => api.post<{ migrated: number }>('/trade-licenses/migrate-trades'),
};

export const waterSuppliesApi = createCrudApi<WaterSupply>('/water-supply');
export const propertyTaxesApi = createCrudApi<PropertyTax>('/property-tax');

// ── CSC Services ──
export const panCardsApi = createCrudApi<PanCardRecord>('/csc-services/pan-cards');
export const passportsApi = createCrudApi<PassportRecord>('/csc-services/passports');
export const voterCardsApiLegacy = voterCardsApi; // Keep reference if needed, but voterCardsApi is exported
