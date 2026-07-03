import axios from 'axios';
import { Capacitor } from '@capacitor/core';

function reconstructServices(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(reconstructServices);
  }

  const newObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (key === 'servicesProvided' && Array.isArray(obj[key])) {
        const rawArray: string[] = obj[key];
        const mergedArray: string[] = [];
        let i = 0;
        while (i < rawArray.length) {
          const item = rawArray[i];
          if (item && item.trim() === 'Misc (Form' && i + 1 < rawArray.length && rawArray[i + 1]?.trim() === 'Xerox Copies)') {
            mergedArray.push('Misc (Form, Xerox Copies)');
            i += 2;
          } else {
            mergedArray.push(item);
            i++;
          }
        }
        newObj[key] = Array.from(new Set(mergedArray));
      } else {
        newObj[key] = reconstructServices(obj[key]);
      }
    }
  }
  return newObj;
}

const isCapacitor = typeof window !== 'undefined' && Capacitor.isNativePlatform();

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  let url = envUrl || '/api';

  if (isCapacitor) {
    if (envUrl && envUrl.startsWith('http')) {
      url = envUrl;
    } else {
      url = 'https://guravonlineservices.duckdns.org';
    }
  } else if (envUrl) {
    url = envUrl;
  }

  // Automatically append /api if it is not already present
  if (url !== '/api' && !url.endsWith('/api')) {
    url = url.endsWith('/') ? `${url}api` : `${url}/api`;
  }

  console.log('[API] Base URL initialized as:', url);
  return url;
};

export const api = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
});

// Added debug interceptor to log every request
api.interceptors.request.use((config) => {
  console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => {
    if (res.data && res.data.success !== undefined && res.data.data !== undefined) {
      res.data = res.data.data;
    }
    res.data = reconstructServices(res.data);
    return res;
  },
  (err) => {
    if (err.response?.data && err.response.data.success === false && err.response.data.error) {
      err.response.data.message = err.response.data.error.message;
      err.response.data.statusCode = err.response.data.error.statusCode;
    }
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

function createCrudApi<T>(basePath: string) {
  return {
    getAll: (params?: Record<string, string>) => api.get<T[]>(basePath, { params }),
    getOne: (id: string) => api.get<T>(`${basePath}/${id}`),
    create: (data: unknown) => api.post<T>(basePath, data),
    update: (id: string, data: unknown) => api.put<T>(`${basePath}/${id}`, data),
    delete: (id: string) => api.delete(`${basePath}/${id}`),
  };
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ accessToken: string; user: import('@/types').AuthUser }>('/auth/login', { email, password }),
  me: () => api.get<import('@/types').AuthUser>('/auth/me'),
  resetPassword: (password: string) => api.post<{ success: boolean }>('/auth/reset-password', { password }),
  updateProfile: (data: { name?: string; signature?: string }) => api.put<import('@/types').AuthUser>('/auth/profile', data),
  getPasskeyRegisterOptions: () =>
    api.get<{ options: any; sessionId: string }>('/auth/passkey/register-options'),
  verifyPasskeyRegister: (sessionId: string, credential: any) =>
    api.post<{ success: boolean }>('/auth/passkey/register-verify', { sessionId, credential }),
  getPasskeyLoginOptions: () =>
    api.get<{ options: any; sessionId: string }>('/auth/passkey/login-options'),
  verifyPasskeyLogin: (sessionId: string, credential: any) =>
    api.post<{ accessToken: string; user: import('@/types').AuthUser }>('/auth/passkey/login-verify', { sessionId, credential }),
};

export const affidavitsApi = createCrudApi<import('@/types').Affidavit>('/affidavits');

export const marriagesApi = {
  ...createCrudApi<import('@/types').Marriage>('/marriages'),
  // Tickets
  createTicket: (data: unknown) => api.post<import('@/types').MarriageTicket>('/marriages/tickets', data),
  updateTicket: (id: string, data: unknown) => api.put<import('@/types').MarriageTicket>(`/marriages/tickets/${id}`, data),
  confirmTicket: (id: string, data?: unknown) => api.post<import('@/types').MarriageTicket>(`/marriages/tickets/${id}/confirm`, data),
  getAllTickets: (params?: Record<string, string>) =>
    api.get<import('@/types').MarriageTicket[]>('/marriages/tickets', { params }),
  getTicketById: (id: string) => api.get<import('@/types').MarriageTicket>(`/marriages/tickets/${id}`),
  addPayment: (data: unknown) => api.post('/marriages/payments', data),
  deletePayment: (id: string) => api.delete(`/marriages/payments/${id}`),
  getAllPayments: (params?: Record<string, string>) =>
    api.get<import('@/types').MarriagePayment[]>('/marriages/payments', { params }),
};

export const birthDeathApi = createCrudApi<import('@/types').BirthDeathCertificate>('/birth-death-certificates');

export const dashboardApi = {
  getSummary: (params?: { from?: string; to?: string }) =>
    api.get<import('@/types').DashboardSummary>('/dashboard/summary', { params }),
};

export const usersApi = {
  ...createCrudApi<import('@/types').User>('/users'),
  getOne: undefined as any, // Not used, but just in case
};

export const settingsApi = {
  getPricingMap: () => api.get<import('@/types').PricingMap>('/settings/pricing/map'),
  getAll: () => api.get<import('@/types').PricingSetting[]>('/settings/pricing'),
  updateMany: (updates: Record<string, number>) =>
    api.patch<import('@/types').PricingSetting[]>('/settings/pricing', { updates }),
  resetDefaults: () => api.post<import('@/types').PricingSetting[]>('/settings/pricing/reset'),
};

export const propertyCardsApi = createCrudApi<import('@/types').PropertyCard>('/property-cards');

export const shopActLicensesApi = createCrudApi<import('@/types').ShopActLicense>('/shop-act-licenses');

export const customersApi = {
  ...createCrudApi<import('@/types').Customer>('/customers'),
  getOne: (id: string) => api.get<import('@/types').CustomerDetails>(`/customers/${id}`),
  lookup: (phone: string) => api.get<import('@/types').Customer>('/customers/lookup', { params: { phone } }),
};

export const tradeLicensesApi = {
  getConfigs: () => api.get<import('@/types').TradeTypeConfig[]>('/trade-licenses/configs'),
  createConfig: (data: unknown) => api.post<import('@/types').TradeTypeConfig>('/trade-licenses/configs', data),
  deleteConfig: (id: string) => api.delete(`/trade-licenses/configs/${id}`),

  ...createCrudApi<import('@/types').TradeLicenseRecord>('/trade-licenses'),

  getAllBusinesses: (params?: Record<string, string>) =>
    api.get<import('@/types').Business[]>('/trade-licenses/businesses', { params }),
  getBusinessDetails: (id: string) => api.get<any>(`/trade-licenses/businesses/${id}`),
  getRenewalQueue: () => api.get<import('@/types').Business[]>('/trade-licenses/businesses/renewal-queue'),
  approveApplication: (id: string, licenseNo: string) =>
    api.patch<import('@/types').TradeLicenseRecord>(`/trade-licenses/${id}/approve`, { licenseNo }),

  // Payments
  addPayment: (recordId: string, data: unknown) =>
    api.post<import('@/types').TradeLicensePayment>(`/trade-licenses/records/${recordId}/payments`, data),
  deletePayment: (id: string) => api.delete(`/trade-licenses/payments/${id}`),
  getAllPayments: (params?: Record<string, string>) =>
    api.get<import('@/types').TradeLicensePayment[]>('/trade-licenses/payments', { params }),
};

export const panCardsApi = createCrudApi<import('@/types').PanCardRecord>('/csc-services/pan-cards');

export const passportsApi = createCrudApi<import('@/types').PassportRecord>('/csc-services/passports');

export const gazettesApi = createCrudApi<import('@/types').Gazette>('/gazettes');

export const waterSuppliesApi = createCrudApi<import('@/types').WaterSupply>('/water-supply');

export const propertyTaxesApi = createCrudApi<import('@/types').PropertyTax>('/property-tax');

export const voterCardsApi = createCrudApi<import('@/types').VoterCardRecord>('/csc-services/voter-cards');

export const expensesApi = createCrudApi<import('@/types').Expense>('/expenses');

export const activityLogsApi = {
  getAll: (params?: { limit?: number; offset?: number }) =>
    api.get<{ data: import('@/types').ActivityLog[]; total: number }>('/activity-logs', { params }),
};

export const publicReceiptsApi = {
  getOne: (type: string, id: string) => api.get<any>(`/public-receipts/${type}/${id}`),
};


