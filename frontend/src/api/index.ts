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
