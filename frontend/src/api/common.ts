import { api, createCrudApi } from "./client";
import {
  DashboardSummary,
  User,
  PricingMap,
  PricingSetting,
  Customer,
  CustomerDetails,
  Expense,
  ActivityLog,
} from "@/types";

export const dashboardApi = {
  getSummary: (params?: { from?: string; to?: string }) =>
    api.get<DashboardSummary>("/dashboard/summary", { params }),
};

export const usersApi = {
  ...createCrudApi<User>("/users"),
  getOne: undefined as any, // Not used, but just in case
};

export const settingsApi = {
  getPricingMap: () => api.get<PricingMap>("/settings/pricing/map"),
  getAll: () => api.get<PricingSetting[]>("/settings/pricing"),
  updateMany: (updates: Record<string, number>) =>
    api.patch<PricingSetting[]>("/settings/pricing", { updates }),
  resetDefaults: () => api.post<PricingSetting[]>("/settings/pricing/reset"),
};

export const customersApi = {
  ...createCrudApi<Customer>("/customers"),
  getOne: (id: string) => api.get<CustomerDetails>(`/customers/${id}`),
  lookup: (phone: string) =>
    api.get<Customer>("/customers/lookup", { params: { phone } }),
};

export const expensesApi = createCrudApi<Expense>("/expenses");

export const activityLogsApi = {
  getAll: (params?: { limit?: number; offset?: number }) =>
    api.get<{ data: ActivityLog[]; total: number }>("/activity-logs", {
      params,
    }),
};

export const publicReceiptsApi = {
  getOne: (type: string, id: string) =>
    api.get<any>(`/public-receipts/${type}/${id}`),
};

export const referencesApi = {
  getAll: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get<{ data: any[]; total: number; page: number; limit: number }>(
      "/references",
      { params },
    ),
};
