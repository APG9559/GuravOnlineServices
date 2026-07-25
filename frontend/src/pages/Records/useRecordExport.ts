import { SubTab } from '@/types';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/utils/format';
import { EXPORT_MAPPERS } from './constants.tsx';
import {
  affidavitsApi,
  marriagesApi,
  birthDeathApi,
  propertyCardsApi,
  shopActLicensesApi,
  tradeLicensesApi,
  panCardsApi,
  passportsApi,
  voterCardsApi,
  gazettesApi,
  waterSuppliesApi,
  propertyTaxesApi,
} from '@/api';

const API_MAP: Record<
  SubTab,
  {
    getAll: (params?: Record<string, string>) => Promise<{ data: unknown }>;
  }
> = {
  affidavits: affidavitsApi,
  marriages: marriagesApi,
  birthDeath: birthDeathApi,
  propertyCards: propertyCardsApi,
  shopAct: shopActLicensesApi,
  tradeLicenses: tradeLicensesApi,
  panCards: panCardsApi,
  passports: passportsApi,
  voterCards: voterCardsApi,
  gazettes: gazettesApi,
  waterSupplies: waterSuppliesApi,
  propertyTaxes: propertyTaxesApi,
};

interface UseRecordExportParams {
  subTab: SubTab;
  debouncedSearch?: string;
  from?: string;
  to?: string;
  authorizerType?: string;
}

export function useRecordExport({
  subTab,
  debouncedSearch,
  from,
  to,
  authorizerType,
}: UseRecordExportParams) {
  const toast = useToast();

  const todayStr = () => new Date().toISOString().split('T')[0];

  const exportCurrent = async () => {
    const config = EXPORT_MAPPERS[subTab];
    if (!config) return;
    const exportParams = {
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      ...(subTab === 'affidavits' && authorizerType ? { authorizerType } : {}),
    };
    try {
      const response = await API_MAP[subTab].getAll(exportParams);
      const allRecords = response.data;
      const rows = (allRecords as never[]).map(config.mapRow as (r: never) => Record<string, unknown>);
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, config.sheetName);
      XLSX.writeFile(wb, `${config.fileName}_${todayStr()}.xlsx`);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to export records.'));
    }
  };

  return { exportCurrent };
}
