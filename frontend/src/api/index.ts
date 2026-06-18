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
