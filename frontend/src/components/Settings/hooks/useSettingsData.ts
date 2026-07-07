import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/api';
import { PricingSetting } from '@/types';
import { useToast } from '@/context/ToastContext';

interface EditState {
  [key: string]: string;
}

export function useSettingsData() {
  const qc = useQueryClient();
  const toast = useToast();
  const [editValues, setEditValues] = useState<EditState>({});
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [resetConfirm, setResetConfirm] = useState(false);

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['pricing-settings'],
    queryFn: () => settingsApi.getAll().then((r) => r.data),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (settings.length > 0) {
      const init: EditState = {};
      settings.forEach((s: PricingSetting) => {
        init[s.key] = String(s.value);
      });
      setEditValues(init);
      setDirty(new Set());
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (updates: Record<string, number>) =>
      settingsApi.updateMany(updates).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing-settings'] });
      qc.invalidateQueries({ queryKey: ['pricing-map'] });
      setDirty(new Set());
      toast.success('Pricing updated. All calculators and forms now use the new rates immediately.');
    },
    onError: () => {
      toast.error('Failed to save changes. Please try again.');
    }
  });

  const resetMutation = useMutation({
    mutationFn: () => settingsApi.resetDefaults().then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing-settings'] });
      qc.invalidateQueries({ queryKey: ['pricing-map'] });
      setResetConfirm(false);
      toast.success('Pricing reset to defaults successfully.');
    },
    onError: () => {
      toast.error('Failed to reset pricing settings.');
    }
  });

  const handleChange = (key: string, val: string) => {
    setEditValues((prev) => ({ ...prev, [key]: val }));
    setDirty((prev) => {
      const n = new Set(prev);
      n.add(key);
      return n;
    });
  };

  const handleSave = () => {
    const updates: Record<string, number> = {};
    dirty.forEach((key) => {
      const num = parseFloat(editValues[key]);
      if (!isNaN(num)) updates[key] = num;
    });
    if (Object.keys(updates).length > 0) updateMutation.mutate(updates);
  };

  const groups = settings.reduce((acc: Record<string, PricingSetting[]>, s: PricingSetting) => {
    if (!acc[s.group]) acc[s.group] = [];
    acc[s.group].push(s);
    return acc;
  }, {});

  return {
    settings,
    isLoading,
    editValues,
    dirty,
    resetConfirm,
    setResetConfirm,
    handleChange,
    handleSave,
    groups,
    resetMutation,
    updateMutation,
  };
}
