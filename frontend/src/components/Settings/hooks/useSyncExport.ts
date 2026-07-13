import { useState } from 'react';
import { api } from '@/api';
import { useToast } from '@/context/ToastContext';

export interface SyncTableCategory {
  label: string;
  tables: string[];
}

export const SYNC_TABLE_CATEGORIES: SyncTableCategory[] = [
  {
    label: 'Core',
    tables: [
      'users',
      'passkeys',
      'customers',
      'pricing_settings',
      'expenses',
      'activity_logs',
      'message_logs',
    ],
  },
  {
    label: 'Aaple Sarkar',
    tables: [
      'affidavits',
      'property_cards',
      'shop_act_licenses',
      'gazettes',
      'birth_death_certificates',
      'property_tax_records',
    ],
  },
  {
    label: 'KMC',
    tables: [
      'marriages',
      'marriage_tickets',
      'marriage_payments',
      'trade_type_configs',
      'businesses',
      'business_trades',
      'trade_license_records',
      'trade_license_payments',
    ],
  },
  {
    label: 'CSC',
    tables: ['pan_card_records', 'passport_records', 'voter_card_records'],
  },
  {
    label: 'Water Supply',
    tables: [
      'water_connections',
      'water_service_records',
      'water_payments',
      'water_documents',
      'water_fee_configs',
    ],
  },
];

export const ALL_SYNC_TABLES = SYNC_TABLE_CATEGORIES.flatMap((c) => c.tables);
export type SyncTable = string;

export function useSyncExport() {
  const toast = useToast();
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set(ALL_SYNC_TABLES));
  const [exporting, setExporting] = useState(false);

  const toggleTable = (table: string) => {
    setSelectedTables((prev) => {
      const next = new Set(prev);
      if (next.has(table)) next.delete(table);
      else next.add(table);
      return next;
    });
  };

  const toggleCategory = (category: SyncTableCategory, select: boolean) => {
    setSelectedTables((prev) => {
      const next = new Set(prev);
      for (const table of category.tables) {
        if (select) next.add(table);
        else next.delete(table);
      }
      return next;
    });
  };

  const selectAll = () => setSelectedTables(new Set(ALL_SYNC_TABLES));
  const deselectAll = () => setSelectedTables(new Set<string>());

  const exportSyncFile = async () => {
    if (selectedTables.size === 0) {
      toast.error('Select at least one table to export.');
      return;
    }
    setExporting(true);
    try {
      const params = { tables: Array.from(selectedTables).join(',') };
      const res = await api.get('/settings/sync/export', {
        params,
        responseType: 'blob',
        timeout: 300_000,
      });
      const blob = new Blob([res.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const disposition = res.headers['content-disposition'] || '';
      const match = disposition.match(/filename="?(.+?)"?$/);
      a.href = url;
      a.download = match ? match[1] : `sync_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Sync file downloaded successfully.');
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(errObj.response?.data?.message || errObj.message || 'Failed to export sync file.');
    } finally {
      setExporting(false);
    }
  };

  return {
    categories: SYNC_TABLE_CATEGORIES,
    allTables: ALL_SYNC_TABLES,
    selectedTables,
    toggleTable,
    toggleCategory,
    selectAll,
    deselectAll,
    exporting,
    exportSyncFile,
  };
}

export type SyncExportHook = ReturnType<typeof useSyncExport>;
