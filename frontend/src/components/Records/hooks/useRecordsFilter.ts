import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppPrint } from '@/hooks/useAppPrint';
import useDebounce from '@/hooks/useDebounce';
import { useToast } from '@/context/ToastContext';
import { SubTab } from '@/types';
import {
  affidavitsApi, marriagesApi, birthDeathApi, propertyCardsApi,
  shopActLicensesApi, tradeLicensesApi, panCardsApi, passportsApi, voterCardsApi, gazettesApi, waterSuppliesApi, propertyTaxesApi
} from '@/api';

export type TopCategory = 'KMC' | 'CSC' | 'AapleSarkar';

const API_MAP: Record<SubTab, any> = {
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

const QUERY_KEY_MAP: Record<SubTab, string> = {
  affidavits: 'affidavits',
  marriages: 'marriages',
  birthDeath: 'birth-death',
  tradeLicenses: 'trade-licenses',
  panCards: 'pan-cards',
  passports: 'passports',
  voterCards: 'voter-cards',
  propertyCards: 'property-cards',
  shopAct: 'shop-act-licenses',
  gazettes: 'gazettes',
  waterSupplies: 'waterSupplies',
  propertyTaxes: 'propertyTaxes',
};

export function useRecordsFilter() {
  const toast = useToast();
  const qc = useQueryClient();

  const [topCategory, setTopCategory] = useState<TopCategory>('KMC');
  const [subTab, setSubTab] = useState<SubTab>('marriages');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 600);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [editingRecord, setEditingRecord] = useState<{ type: SubTab; data: any } | null>(null);
  const [viewingRecord, setViewingRecord] = useState<{ type: SubTab; data: any } | null>(null);
  const [printRecord, setPrintRecord] = useState<{ type: SubTab; data: any } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  // Reset page when subTab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [subTab]);

  const receiptRef = useRef<HTMLDivElement>(null);
  const handlePrint = useAppPrint({ content: () => receiptRef.current });

  const params = useMemo(() => ({
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    page: String(currentPage),
    limit: String(PAGE_SIZE),
  }), [debouncedSearch, from, to, currentPage]);

  const { data, isLoading } = useQuery<any>({
    queryKey: [QUERY_KEY_MAP[subTab], params],
    queryFn: () => API_MAP[subTab].getAll(params).then((r: any) => r.data),
    staleTime: 30_000,
  });

  const recordsList = data?.records || [];
  const totalCount = data?.total || 0;
  const totalPages = data?.totalPages || 0;

  const deleteMutation = useMutation({
    mutationFn: ({ type, id }: { type: SubTab; id: string }) => API_MAP[type].delete(id),
    onSuccess: (_, { type }) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY_MAP[type]] });
      toast.success('Record deleted successfully.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete record.');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ type, id, data }: { type: SubTab; id: string; data: any }) => API_MAP[type].update(id, data),
    onSuccess: (_, { type }) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY_MAP[type]] });
      setEditingRecord(null);
      toast.success('Record updated successfully.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to update record.');
    }
  });

  const triggerPrint = (tab: SubTab, row: any) => {
    setPrintRecord({ type: tab, data: row });
    setTimeout(() => {
      handlePrint();
    }, 100);
  };

  const handleTopCategoryChange = (cat: TopCategory) => {
    setTopCategory(cat);
    if (cat === 'KMC') setSubTab('marriages');
    else if (cat === 'CSC') setSubTab('panCards');
    else setSubTab('affidavits');
  };

  return {
    topCategory,
    setTopCategory,
    subTab,
    setSubTab,
    search,
    setSearch,
    debouncedSearch,
    from,
    setFrom,
    to,
    setTo,
    editingRecord,
    setEditingRecord,
    viewingRecord,
    setViewingRecord,
    printRecord,
    setPrintRecord,
    currentPage,
    setCurrentPage,
    PAGE_SIZE,
    recordsList,
    totalCount,
    totalPages,
    isLoading,
    deleteMutation,
    updateMutation,
    triggerPrint,
    handleTopCategoryChange,
    receiptRef,
    handlePrint,
    API_MAP,
  };
}
