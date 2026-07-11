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
  WaterConnection,
  WaterServiceRecord,
  WaterPayment,
  WaterFeeConfig,
  WaterDocument,
  MessageTemplate,
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

export const waterSuppliesApi = {
  // Configs
  getConfigs: () => api.get<WaterFeeConfig[]>('/water-supply/configs'),
  createConfig: (data: unknown) => api.post<WaterFeeConfig>('/water-supply/configs', data),
  updateConfig: (id: string, data: unknown) => api.put<WaterFeeConfig>(`/water-supply/configs/${id}`, data),
  deleteConfig: (id: string) => api.delete(`/water-supply/configs/${id}`),

  // Connections
  getAllConnections: (params?: Record<string, string>) =>
    api.get<WaterConnection[]>('/water-supply/connections', { params }),
  getConnectionDetails: (id: string) => api.get<any>(`/water-supply/connections/${id}`),
  approveConnection: (id: string, connectionNo: string) =>
    api.post<WaterConnection>(`/water-supply/connections/${id}/approve`, { connectionNo }),

  // Records
  getAll: (params?: Record<string, string>) =>
    api.get<any>('/water-supply/records', { params }),
  getById: (id: string) => api.get<WaterServiceRecord>(`/water-supply/records/${id}`),
  create: (data: unknown) => api.post<WaterServiceRecord>('/water-supply/records', data),
  update: (id: string, data: unknown) => api.put<WaterServiceRecord>(`/water-supply/records/${id}`, data),
  delete: (id: string) => api.delete(`/water-supply/records/${id}`),

  // Payments
  addPayment: (recordId: string, data: unknown) =>
    api.post<WaterPayment>(`/water-supply/records/${recordId}/payments`, data),
  deletePayment: (id: string) => api.delete(`/water-supply/payments/${id}`),
  getAllPayments: (params?: Record<string, string>) =>
    api.get<WaterPayment[]>('/water-supply/payments', { params }),

  // Documents
  addDocument: (recordId: string, data: unknown) =>
    api.post<WaterDocument>(`/water-supply/records/${recordId}/documents`, data),
  deleteDocument: (id: string) => api.delete(`/water-supply/documents/${id}`),
};
export const propertyTaxesApi = createCrudApi<PropertyTax>('/property-tax');

// ── CSC Services ──
export const panCardsApi = createCrudApi<PanCardRecord>('/csc-services/pan-cards');
export const passportsApi = createCrudApi<PassportRecord>('/csc-services/passports');
export const voterCardsApiLegacy = voterCardsApi; // Keep reference if needed, but voterCardsApi is exported

// ── Message Logs ──
export interface CreateMessageLogPayload {
  module: string;
  templateId?: string;
  templateLabel?: string;
  channel: 'whatsapp' | 'sms';
  recipientName?: string;
  recipientPhone: string;
  messageBody: string;
  recordId?: string;
}

export interface MessageLog {
  id: string;
  module: string;
  templateId: string | null;
  templateLabel: string | null;
  channel: string;
  recipientName: string | null;
  recipientPhone: string;
  messageBody: string;
  recordId: string | null;
  sentBy?: { id: string; name: string } | null;
  createdAt: string;
}

export const messageLogsApi = {
  create: (data: CreateMessageLogPayload) =>
    api.post<MessageLog>('/message-logs', data),

  getAll: (params?: Partial<{
    module: string;
    channel: string;
    phone: string;
    name: string;
    from: string;
    to: string;
    page: number;
    limit: number;
  }>) =>
    api.get<{ data: MessageLog[]; total: number; page: number; limit: number }>(
      '/message-logs',
      { params },
    ),
};

// ── Message Templates ──
export const messageTemplatesApi = createCrudApi<MessageTemplate>('/message-templates');

