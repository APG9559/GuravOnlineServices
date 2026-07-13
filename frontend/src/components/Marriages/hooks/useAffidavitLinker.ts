import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { affidavitsApi } from '@/api';
import { Affidavit } from '@/types';

interface UseAffidavitLinkerProps {
  setValue: (name: 'affidavitIds', value: string[]) => void;
  phoneWatch: string;
  watchContactName: string;
}

export function useAffidavitLinker({
  setValue,
  phoneWatch,
  watchContactName,
}: UseAffidavitLinkerProps) {
  const [selectedAffidavits, setSelectedAffidavits] = useState<Affidavit[]>([]);
  const [linkedAffs, setLinkedAffs] = useState<Record<string, Affidavit>>({});
  const [activeSearchPurpose, setActiveSearchPurpose] = useState<string | null>(null);
  const [affSearch, setAffSearch] = useState('');
  const [showAffDropdown, setShowAffDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch affidavits for search dropdown
  const { data: affidavitResults = [] } = useQuery({
    queryKey: ['affidavits-search', affSearch],
    queryFn: () => affidavitsApi.getAll(affSearch ? { search: affSearch } : {}).then((r) => r.data),
    enabled: affSearch.length >= 1,
    staleTime: 30_000,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowAffDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectAffidavit = (aff: Affidavit) => {
    if (selectedAffidavits.some((x) => x.id === aff.id)) {
      setAffSearch('');
      setShowAffDropdown(false);
      return;
    }
    const updated = [...selectedAffidavits, aff];
    setSelectedAffidavits(updated);
    setValue(
      'affidavitIds',
      updated.map((x) => x.id),
    );
    setAffSearch('');
    setShowAffDropdown(false);
  };

  const unlinkAffidavit = (id: string) => {
    const updated = selectedAffidavits.filter((x) => x.id !== id);
    setSelectedAffidavits(updated);
    setValue(
      'affidavitIds',
      updated.map((x) => x.id),
    );
  };

  const linkRequiredAffidavit = (purpose: string, aff: Affidavit) => {
    const next = { ...linkedAffs, [purpose]: aff };
    setLinkedAffs(next);
    setValue(
      'affidavitIds',
      Object.values(next).map((a) => a.id),
    );
    setActiveSearchPurpose(null);
    setAffSearch('');
  };

  const unlinkRequiredAffidavit = (purpose: string) => {
    const next = { ...linkedAffs };
    delete next[purpose];
    setLinkedAffs(next);
    setValue(
      'affidavitIds',
      Object.values(next).map((a) => a.id),
    );
  };

  const startSearch = (purpose: string) => {
    setActiveSearchPurpose(purpose);
    setAffSearch(phoneWatch || watchContactName || '');
    setShowAffDropdown(true);
  };

  const cancelSearch = () => {
    setActiveSearchPurpose(null);
    setAffSearch('');
  };

  const resetLinker = () => {
    setSelectedAffidavits([]);
    setLinkedAffs({});
    setActiveSearchPurpose(null);
    setAffSearch('');
    setShowAffDropdown(false);
  };

  return {
    selectedAffidavits,
    setSelectedAffidavits,
    linkedAffs,
    setLinkedAffs,
    activeSearchPurpose,
    setActiveSearchPurpose,
    affSearch,
    setAffSearch,
    showAffDropdown,
    setShowAffDropdown,
    dropdownRef,
    affidavitsResults: affidavitResults,
    selectAffidavit,
    unlinkAffidavit,
    linkRequiredAffidavit,
    unlinkRequiredAffidavit,
    startSearch,
    cancelSearch,
    resetLinker,
  };
}
