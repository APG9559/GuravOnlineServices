import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ accessToken: string; user: import('@/types').AuthUser }>('/auth/login', { email, password }),
  me: () => api.get<import('@/types').AuthUser>('/auth/me'),
  resetPassword: (password: string) => api.post<{ success: boolean }>('/auth/reset-password', { password }),
};

export const affidavitsApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<import('@/types').Affidavit[]>('/affidavits', { params }),
  getOne: (id: string) => api.get<import('@/types').Affidavit>(`/affidavits/${id}`),
  create: (data: unknown) => api.post<import('@/types').Affidavit>('/affidavits', data),
  update: (id: string, data: unknown) => api.put<import('@/types').Affidavit>(`/affidavits/${id}`, data),
  delete: (id: string) => api.delete(`/affidavits/${id}`),
};

export const marriagesApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<import('@/types').Marriage[]>('/marriages', { params }),
  getOne: (id: string) => api.get<import('@/types').Marriage>(`/marriages/${id}`),
  create: (data: unknown) => api.post<import('@/types').Marriage>('/marriages', data),
  update: (id: string, data: unknown) => api.put<import('@/types').Marriage>(`/marriages/${id}`, data),
  delete: (id: string) => api.delete(`/marriages/${id}`),
  // Tickets
  createTicket: (data: unknown) => api.post<import('@/types').MarriageTicket>('/marriages/tickets', data),
  confirmTicket: (id: string) => api.post<import('@/types').MarriageTicket>(`/marriages/tickets/${id}/confirm`),
  getAllTickets: (params?: Record<string, string>) =>
    api.get<import('@/types').MarriageTicket[]>('/marriages/tickets', { params }),
  getTicketById: (id: string) => api.get<import('@/types').MarriageTicket>(`/marriages/tickets/${id}`),
};

export const birthDeathApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<import('@/types').BirthDeathCertificate[]>('/birth-death-certificates', { params }),
  getOne: (id: string) => api.get<import('@/types').BirthDeathCertificate>(`/birth-death-certificates/${id}`),
  create: (data: unknown) => api.post<import('@/types').BirthDeathCertificate>('/birth-death-certificates', data),
  update: (id: string, data: unknown) => api.put<import('@/types').BirthDeathCertificate>(`/birth-death-certificates/${id}`, data),
  delete: (id: string) => api.delete(`/birth-death-certificates/${id}`),
};

export const dashboardApi = {
  getSummary: (params?: { from?: string; to?: string }) =>
    api.get<import('@/types').DashboardSummary>('/dashboard/summary', { params }),
};

export const usersApi = {
  getAll: () => api.get<import('@/types').User[]>('/users'),
  create: (data: unknown) => api.post<import('@/types').User>('/users', data),
  update: (id: string, data: unknown) => api.put<import('@/types').User>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export const settingsApi = {
  getPricingMap: () => api.get<import('@/types').PricingMap>('/settings/pricing/map'),
  getAll: () => api.get<import('@/types').PricingSetting[]>('/settings/pricing'),
  updateMany: (updates: Record<string, number>) =>
    api.patch<import('@/types').PricingSetting[]>('/settings/pricing', { updates }),
  resetDefaults: () => api.post<import('@/types').PricingSetting[]>('/settings/pricing/reset'),
};

export const propertyCardsApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<import('@/types').PropertyCard[]>('/property-cards', { params }),
  getOne: (id: string) => api.get<import('@/types').PropertyCard>(`/property-cards/${id}`),
  create: (data: unknown) => api.post<import('@/types').PropertyCard>('/property-cards', data),
  update: (id: string, data: unknown) => api.put<import('@/types').PropertyCard>(`/property-cards/${id}`, data),
  delete: (id: string) => api.delete(`/property-cards/${id}`),
};

export const shopActLicensesApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<import('@/types').ShopActLicense[]>('/shop-act-licenses', { params }),
  getOne: (id: string) => api.get<import('@/types').ShopActLicense>(`/shop-act-licenses/${id}`),
  create: (data: unknown) => api.post<import('@/types').ShopActLicense>('/shop-act-licenses', data),
  update: (id: string, data: unknown) => api.put<import('@/types').ShopActLicense>(`/shop-act-licenses/${id}`, data),
  delete: (id: string) => api.delete(`/shop-act-licenses/${id}`),
};

export const customersApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<import('@/types').Customer[]>('/customers', { params }),
  getOne: (id: string) => api.get<import('@/types').CustomerDetails>(`/customers/${id}`),
  create: (data: unknown) => api.post<import('@/types').Customer>('/customers', data),
  update: (id: string, data: unknown) => api.put<import('@/types').Customer>(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
  lookup: (phone: string) => api.get<import('@/types').Customer>('/customers/lookup', { params: { phone } }),
};

export const tradeLicensesApi = {
  getConfigs: () => api.get<import('@/types').TradeTypeConfig[]>('/trade-licenses/configs'),
  createConfig: (data: unknown) => api.post<import('@/types').TradeTypeConfig>('/trade-licenses/configs', data),
  deleteConfig: (id: string) => api.delete(`/trade-licenses/configs/${id}`),

  getAll: (params?: Record<string, string>) =>
    api.get<import('@/types').TradeLicenseRecord[]>('/trade-licenses', { params }),
  getOne: (id: string) => api.get<import('@/types').TradeLicenseRecord>(`/trade-licenses/${id}`),
  create: (data: unknown) => api.post<import('@/types').TradeLicenseRecord>('/trade-licenses', data),
  update: (id: string, data: unknown) => api.put<import('@/types').TradeLicenseRecord>(`/trade-licenses/${id}`, data),
  delete: (id: string) => api.delete(`/trade-licenses/${id}`),

  getAllBusinesses: (params?: Record<string, string>) =>
    api.get<import('@/types').Business[]>('/trade-licenses/businesses', { params }),
  getBusinessDetails: (id: string) => api.get<any>(`/trade-licenses/businesses/${id}`),
  getRenewalQueue: () => api.get<import('@/types').Business[]>('/trade-licenses/businesses/renewal-queue'),
  approveApplication: (id: string, licenseNo: string) =>
    api.patch<import('@/types').TradeLicenseRecord>(`/trade-licenses/${id}/approve`, { licenseNo }),
};

export const panCardsApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<import('@/types').PanCardRecord[]>('/csc-services/pan-cards', { params }),
  getOne: (id: string) => api.get<import('@/types').PanCardRecord>(`/csc-services/pan-cards/${id}`),
  create: (data: unknown) => api.post<import('@/types').PanCardRecord>('/csc-services/pan-cards', data),
  update: (id: string, data: unknown) => api.put<import('@/types').PanCardRecord>(`/csc-services/pan-cards/${id}`, data),
  delete: (id: string) => api.delete(`/csc-services/pan-cards/${id}`),
};

export const passportsApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<import('@/types').PassportRecord[]>('/csc-services/passports', { params }),
  getOne: (id: string) => api.get<import('@/types').PassportRecord>(`/csc-services/passports/${id}`),
  create: (data: unknown) => api.post<import('@/types').PassportRecord>('/csc-services/passports', data),
  update: (id: string, data: unknown) => api.put<import('@/types').PassportRecord>(`/csc-services/passports/${id}`, data),
  delete: (id: string) => api.delete(`/csc-services/passports/${id}`),
};

export const gazettesApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<import('@/types').Gazette[]>('/gazettes', { params }),
  getOne: (id: string) => api.get<import('@/types').Gazette>(`/gazettes/${id}`),
  create: (data: unknown) => api.post<import('@/types').Gazette>('/gazettes', data),
  update: (id: string, data: unknown) => api.put<import('@/types').Gazette>(`/gazettes/${id}`, data),
  delete: (id: string) => api.delete(`/gazettes/${id}`),
};

export const waterSuppliesApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<import('@/types').WaterSupply[]>('/water-supply', { params }),
  getOne: (id: string) => api.get<import('@/types').WaterSupply>(`/water-supply/${id}`),
  create: (data: unknown) => api.post<import('@/types').WaterSupply>('/water-supply', data),
  update: (id: string, data: unknown) => api.put<import('@/types').WaterSupply>(`/water-supply/${id}`, data),
  delete: (id: string) => api.delete(`/water-supply/${id}`),
};

export const propertyTaxesApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<import('@/types').PropertyTax[]>('/property-tax', { params }),
  getOne: (id: string) => api.get<import('@/types').PropertyTax>(`/property-tax/${id}`),
  create: (data: unknown) => api.post<import('@/types').PropertyTax>('/property-tax', data),
  update: (id: string, data: unknown) => api.put<import('@/types').PropertyTax>(`/property-tax/${id}`, data),
  delete: (id: string) => api.delete(`/property-tax/${id}`),
};

export const voterCardsApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<import('@/types').VoterCardRecord[]>('/csc-services/voter-cards', { params }),
  getOne: (id: string) => api.get<import('@/types').VoterCardRecord>(`/csc-services/voter-cards/${id}`),
  create: (data: unknown) => api.post<import('@/types').VoterCardRecord>('/csc-services/voter-cards', data),
  update: (id: string, data: unknown) => api.put<import('@/types').VoterCardRecord>(`/csc-services/voter-cards/${id}`, data),
  delete: (id: string) => api.delete(`/csc-services/voter-cards/${id}`),
};

export const expensesApi = {
  getAll: (params?: { userId?: string; from?: string; to?: string; category?: string }) =>
    api.get<import('@/types').Expense[]>('/expenses', { params }),
  getOne: (id: string) => api.get<import('@/types').Expense>(`/expenses/${id}`),
  create: (data: unknown) => api.post<import('@/types').Expense>('/expenses', data),
  update: (id: string, data: unknown) => api.put<import('@/types').Expense>(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
};

export const activityLogsApi = {
  getAll: (params?: { limit?: number; offset?: number }) =>
    api.get<{ data: import('@/types').ActivityLog[]; total: number }>('/activity-logs', { params }),
};
