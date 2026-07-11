import { useState } from 'react';
import { api } from '@/api';
import { useToast } from '@/context/ToastContext';
import type { SyncPreviewResult, SyncImportResult } from '@/types';

export function useSyncImport() {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<SyncPreviewResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearPreview = () => {
    setPreview(null);
    setError(null);
  };

  const updateFile = (nextFile: File | null) => {
    setFile(nextFile);
    setPreview(null);
    setError(null);
  };

  const previewSyncFile = async () => {
    if (!file) {
      setError('Choose a JSON sync file first.');
      return;
    }
    setPreviewing(true);
    setError(null);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const res = await api.post<SyncPreviewResult>('/settings/sync/preview', createFormData(file));
      setPreview(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Preview failed. Ensure the file is valid JSON sync data.');
      setPreview(null);
    } finally {
      setPreviewing(false);
    }
  };

  const importSyncFile = async () => {
    if (!file) {
      setError('Choose a JSON sync file first.');
      return;
    }
    setImporting(true);
    setError(null);
    try {
      const res = await api.post<SyncImportResult>('/settings/sync/import', createFormData(file), {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600_000,
      });
      toast.success(`Import completed: ${res.data.inserted} inserted, ${res.data.skipped} skipped.`);
      setFile(null);
      setPreview(null);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  return {
    file,
    updateFile,
    preview,
    error,
    previewing,
    importing,
    clearPreview,
    previewSyncFile,
    importSyncFile,
  };
}

export type SyncImportHook = ReturnType<typeof useSyncImport>;

function createFormData(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return formData;
}
