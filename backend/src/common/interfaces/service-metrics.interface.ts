export interface ServiceMetricsResult {
  key: string;
  label: string;
  category?: 'KMC' | 'CSC' | 'AapleSarkar';
  count: number;
  gross: number;
  net: number;
  daily: { date: any; net?: number; amount?: number }[];
  userBreakdown: { userId: string; userName: string; gross?: number; net?: number; expenses?: number }[];
  extra?: Record<string, any>;
  isExpense?: boolean;
}

export interface IDashboardMetrics {
  getDashboardMetrics(from: string, to: string, pricing: Record<string, number>): Promise<ServiceMetricsResult>;
}

export const DASHBOARD_METRICS_PROVIDER = 'DASHBOARD_METRICS_PROVIDER';
