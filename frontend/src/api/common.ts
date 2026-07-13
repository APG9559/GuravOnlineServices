import { api, createCrudApi } from './client';
import {
  DashboardSummary,
  User,
  PricingMap,
  PricingSetting,
  Customer,
  CustomerDetails,
  Expense,
  ActivityLog,
} from '@/types';

export const dashboardApi = {
  getSummary: (params?: { from?: string; to?: string }) =>
    api.get<DashboardSummary>('/dashboard/summary', { params }),
};

export const usersApi = {
  ...createCrudApi<User>('/users'),
  getOne: undefined as ((id: string) => Promise<User>) | undefined, // Not used, but just in case
};

export const settingsApi = {
  getPricingMap: () => api.get<PricingMap>('/settings/pricing/map'),
  getAll: () => api.get<PricingSetting[]>('/settings/pricing'),
  updateMany: (updates: Record<string, number>) =>
    api.patch<PricingSetting[]>('/settings/pricing', { updates }),
  resetDefaults: () => api.post<PricingSetting[]>('/settings/pricing/reset'),
  exportSync: (params: { tables: string[] }) =>
    api.get<Blob>('/settings/sync/export', {
      params: { tables: params.tables.join(',') },
      responseType: 'blob',
    }),
  previewSync: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/settings/sync/preview', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  importSync: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/settings/sync/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 600_000,
    });
  },
};

export const customersApi = {
  ...createCrudApi<Customer>('/customers'),
  getOne: (id: string) => api.get<CustomerDetails>(`/customers/${id}`),
  lookup: (phone: string) => api.get<Customer>('/customers/lookup', { params: { phone } }),
};

export const expensesApi = createCrudApi<Expense>('/expenses');

export const activityLogsApi = {
  getAll: (params?: { limit?: number; offset?: number }) =>
    api.get<{ data: ActivityLog[]; total: number }>('/activity-logs', {
      params,
    }),
};

export const publicReceiptsApi = {
  getOne: (type: string, id: string) => api.get<unknown>(`/public-receipts/${type}/${id}`),
};

export const referencesApi = {
  getAll: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get<{ data: unknown[]; total: number; page: number; limit: number }>('/references', { params }),
};
