import axios from 'axios';
import { Capacitor } from '@capacitor/core';

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

  if (import.meta.env.DEV) {
    console.log('[API] Base URL initialized as:', url);
  }
  return url;
};

export const api = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
});

export const nullifyEmptyStrings = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') {
    return obj === '' ? null : obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(nullifyEmptyStrings);
  }
  const cleaned: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cleaned[key] = nullifyEmptyStrings(obj[key]);
    }
  }
  return cleaned;
};

// Added debug interceptor to log every request
api.interceptors.request.use((config) => {
  if (import.meta.env.DEV) {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  }
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload && payload.exp && payload.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return Promise.reject(new Error('Token expired'));
        }
      }
    } catch (e) {
      console.error('[API] Error parsing JWT token:', e);
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (config.data && (Object.prototype.toString.call(config.data) === '[object Object]' || Array.isArray(config.data))) {
    config.data = nullifyEmptyStrings(config.data);
  }
  
  return config;
});

api.interceptors.response.use(
  (res) => {
    if (res.data && res.data.success !== undefined && res.data.data !== undefined) {
      res.data = res.data.data;
    }
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

export function createCrudApi<T>(basePath: string) {
  return {
    getAll: (params?: Record<string, string>) => api.get<T[]>(basePath, { params }),
    getOne: (id: string) => api.get<T>(`${basePath}/${id}`),
    create: (data: unknown) => api.post<T>(basePath, data),
    update: (id: string, data: unknown) => api.put<T>(`${basePath}/${id}`, data),
    delete: (id: string) => api.delete(`${basePath}/${id}`),
  };
}
