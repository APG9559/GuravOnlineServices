import { useState, useEffect, useRef } from 'react';
import { settingsApi, authApi, api } from '@/api';
import { PricingSetting } from '@/types';
import { startRegistration } from '@simplewebauthn/browser';
import { biometricService } from '@/services/biometric';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

// Hooks & Subcomponents
import { useSettingsData } from '@/components/Settings/hooks/useSettingsData';
import { useSyncExport } from '@/components/Settings/hooks/useSyncExport';
import { useSyncImport } from '@/components/Settings/hooks/useSyncImport';
import PricingCard from '@/components/Settings/components/PricingCard';
import BiometricCard from '@/components/Settings/components/BiometricCard';
import DatabaseBackupCard from '@/components/Settings/components/DatabaseBackupCard';

export default function SettingsPage() {
  const toast = useToast();
  const { isAdmin } = useAuth();
  
  // Custom hook for settings pricing logic
  const settingsData = useSettingsData();
  const {
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
  } = settingsData;

  const [reduceAnimations, setReduceAnimations] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('reduce_animations') === 'true';
  });

  const handleToggleReduceAnimations = (checked: boolean) => {
    setReduceAnimations(checked);
    localStorage.setItem('reduce_animations', checked ? 'true' : 'false');
    toast.success(checked ? 'Animations reduced successfully!' : 'Curtain transitions restored!');
  };

  const [registeringPasskey, setRegisteringPasskey] = useState(false);

  // Native biometric state
  const [biometricHardwareAvailable, setBiometricHardwareAvailable] = useState(false);
  const [biometricEnrolled, setBiometricEnrolled] = useState(false);
  const [biometricSaved, setBiometricSaved] = useState(false);
  const [biometricEnrolling, setBiometricEnrolling] = useState(false);
  const [showPasskeyOption, setShowPasskeyOption] = useState(true);

  // Database management state
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMode, setImportMode] = useState<'full' | 'insert'>('insert');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoreConfirmText, setRestoreConfirmText] = useState('');
  const [restoreConfirmChecked, setRestoreConfirmChecked] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear database state
  const [clearing, setClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState('');
  const [clearConfirmChecked, setClearConfirmChecked] = useState(false);

  const syncExport = useSyncExport();
  const syncImport = useSyncImport();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const ua = navigator.userAgent;
      const match = ua.match(/Android\s+([0-9]+)/);
      if (match) {
        const androidVer = parseInt(match[1], 10);
        if (androidVer < 11) {
          setShowPasskeyOption(false);
        }
      }
    }

    biometricService.checkBiometricStatus().then(async (status) => {
      setBiometricHardwareAvailable(status.hasHardware);
      setBiometricEnrolled(status.hasEnrolled);
      if (status.hasEnrolled) {
        const hasToken = await biometricService.hasSavedToken();
        setBiometricSaved(hasToken);
      }
    });
  }, []);

  const handleRegisterPasskey = async () => {
    setRegisteringPasskey(true);
    try {
      const res = await authApi.getPasskeyRegisterOptions();
      const { options, sessionId } = res.data;
      const regResult = await startRegistration(options);
      await authApi.verifyPasskeyRegister(sessionId, regResult);
      toast.success('Passkey registered successfully!');
    } catch (err: any) {
      console.error('[Passkey Register Error]', err);
      if (err.name === 'NotAllowedError') {
        toast.error('Registration cancelled or timed out.');
      } else {
        toast.error(err.response?.data?.message || err.message || 'Failed to register biometric credential.');
      }
    } finally {
      setRegisteringPasskey(false);
    }
  };

  const handleEnrollBiometric = async () => {
    setBiometricEnrolling(true);
    try {
      const token = await biometricService.getTokenWithBiometric();
      if (!token) {
        const currentToken = localStorage.getItem('token');
        if (currentToken) {
          await biometricService.saveToken(currentToken);
          setBiometricSaved(true);
          toast.success('Fingerprint authentication configured!');
        } else {
          toast.error('Session not found. Please log out and log in again to enable fingerprint login.');
        }
      } else {
        setBiometricSaved(true);
        toast.success('Fingerprint authentication configured!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to register fingerprint.');
    } finally {
      setBiometricEnrolling(false);
    }
  };

  const handleRemoveBiometric = async () => {
    await biometricService.deleteToken();
    setBiometricSaved(false);
    toast.info('Fingerprint authentication disabled.');
  };

  const handleExportDatabase = async () => {
    setExporting(true);
    try {
      const res = await api.get('/settings/database/export', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const disposition = res.headers['content-disposition'] || '';
      const match = disposition.match(/filename="?(.+?)"?$/);
      a.href = url;
      a.download = match ? match[1] : `db_backup_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.dump`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Database exported successfully.');
    } catch (err: any) {
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          toast.error(json.message || 'Export failed.');
        } catch { toast.error('Export failed. Check server logs.'); }
      } else {
        toast.error(err.response?.data?.message || err.message || 'Export failed.');
      }
    } finally {
      setExporting(false);
    }
  };

  const handleImportDatabase = async () => {
    if (!importFile) return;
    if (importMode === 'full' && !showRestoreConfirm) {
      setShowRestoreConfirm(true);
      return;
    }
    setShowRestoreConfirm(false);
    setRestoreConfirmText('');
    setRestoreConfirmChecked(false);
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('mode', importMode);
      const res = await api.post('/settings/database/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300_000,
      });
      toast.success(res.data?.message || res.data?.data?.message || 'Import completed successfully.');
      setImportFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  const handleClearDatabase = async () => {
    if (!showClearConfirm) {
      setShowClearConfirm(true);
      return;
    }
    setShowClearConfirm(false);
    setClearConfirmText('');
    setClearConfirmChecked(false);
    setClearing(true);
    try {
      const res = await api.post('/settings/database/clear');
      toast.success(res.data?.message || 'All transactional database records cleared successfully.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to clear database records.');
    } finally {
      setClearing(false);
    }
  };

  const groupLabels: Record<string, string> = {
    property_card: 'Property Card rates',
    shop_act: 'Shop Act License rates',
    affidavit: 'Affidavit / Notary rates',
    marriage: 'Marriage Registration rates',
    birth_death: 'Birth / Death Certificate rates',
    trade_license: 'Trade License rates',
    csc: 'CSC Services rates',
    aaple_sarkar: 'Aaple Sarkar / Gazette rates',
    water_supply: 'Water Supply rates',
    property_tax: 'Property Tax rates',
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Pricing Settings</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {dirty.size > 0 && (
            <button className="btn btn-primary" onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending
                ? 'Saving…'
                : `Save ${dirty.size} change${dirty.size > 1 ? 's' : ''}`}
            </button>
          )}
          <button
            className="btn"
            style={{ color: 'var(--danger)' }}
            onClick={() => setResetConfirm(true)}
          >
            Reset to defaults
          </button>
        </div>
      </div>

      <div style={{
        background: 'var(--accent-light)',
        border: '0.5px solid rgba(24,95,165,0.25)',
        borderRadius: 'var(--radius)',
        padding: '12px 16px',
        fontSize: 13,
        color: 'var(--text)',
        marginBottom: '1.5rem',
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 16 }}>ℹ️</span>
        <div>
          <strong>Changes take effect immediately.</strong> The price calculator and all add-record forms
          pull rates from this table in real time — no restart needed.
          Previously saved records are not affected.
        </div>
      </div>

      {isLoading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading pricing…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {['affidavit', 'marriage', 'birth_death', 'property_card', 'shop_act', 'trade_license', 'csc', 'aaple_sarkar', 'water_supply', 'property_tax']
            .filter((g) => groups[g])
            .map((group) => (
              <PricingCard
                key={group}
                group={group}
                groupLabel={groupLabels[group]}
                groupSettings={groups[group]}
                editValues={editValues}
                dirty={dirty}
                handleChange={handleChange}
                handleSave={handleSave}
                isSaving={updateMutation.isPending}
              />
            ))}

          {/* General & Performance Settings */}
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', fontFamily: "'Space Grotesk', sans-serif" }}>
                General Settings
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Customize application performance and interface preferences.
              </div>
            </div>

            <div style={{ height: '1px', background: 'var(--border)', opacity: 0.5, margin: '4px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                  Reduce Animations & Transitions
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '90%' }}>
                  Replaces heavy liquid gooey SVG filter animations with a faster, memory-efficient opacity fade. Highly recommended for slower devices or saving battery.
                </div>
              </div>
              <div>
                <label className="switch" style={{ display: 'inline-block', position: 'relative', width: 48, height: 26 }}>
                  <input
                    type="checkbox"
                    checked={reduceAnimations}
                    onChange={(e) => handleToggleReduceAnimations(e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span className="slider" style={{
                    position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: reduceAnimations ? 'var(--accent)' : '#ccc',
                    transition: '0.3s', borderRadius: 34,
                    border: '2px solid var(--border)',
                    boxShadow: reduceAnimations ? '2px 2px 0 var(--border)' : 'none'
                  }}>
                    <span style={{
                      position: 'absolute', content: '""', height: 16, width: 16, left: reduceAnimations ? 24 : 4, bottom: 2,
                      backgroundColor: 'white', transition: '0.3s', borderRadius: '50%',
                      border: '2px solid var(--border)'
                    }} />
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Biometrics & Passkeys Card */}
          <BiometricCard
            showPasskeyOption={showPasskeyOption}
            registeringPasskey={registeringPasskey}
            handleRegisterPasskey={handleRegisterPasskey}
            biometricHardwareAvailable={biometricHardwareAvailable}
            biometricEnrolled={biometricEnrolled}
            biometricSaved={biometricSaved}
            biometricEnrolling={biometricEnrolling}
            handleEnrollBiometric={handleEnrollBiometric}
            handleRemoveBiometric={handleRemoveBiometric}
          />

          {/* Database Admin Card (Only visible to Admin) */}
          <DatabaseBackupCard
            isAdmin={isAdmin}
            exporting={exporting}
            handleExportDatabase={handleExportDatabase}
            importing={importing}
            importMode={importMode}
            setImportMode={setImportMode}
            importFile={importFile}
            setImportFile={setImportFile}
            handleImportDatabase={handleImportDatabase}
            showRestoreConfirm={showRestoreConfirm}
            setShowRestoreConfirm={setShowRestoreConfirm}
            restoreConfirmText={restoreConfirmText}
            setRestoreConfirmText={setRestoreConfirmText}
            restoreConfirmChecked={restoreConfirmChecked}
            setRestoreConfirmChecked={setRestoreConfirmChecked}
            fileInputRef={fileInputRef}
            clearing={clearing}
            showClearConfirm={showClearConfirm}
            setShowClearConfirm={setShowClearConfirm}
            clearConfirmText={clearConfirmText}
            setClearConfirmText={setClearConfirmText}
            clearConfirmChecked={clearConfirmChecked}
            setClearConfirmChecked={setClearConfirmChecked}
            handleClearDatabase={handleClearDatabase}
            syncExport={syncExport}
            syncImport={syncImport}
          />
        </div>
      )}

      {/* Reset confirmation modal */}
      {resetConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div className="card" style={{ maxWidth: 400, width: '100%' }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>Reset Pricing Defaults</div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 20 }}>
              Are you sure you want to reset all service rate values back to their system defaults? Unsaved edits will be lost.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn" onClick={() => setResetConfirm(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}
                disabled={resetMutation.isPending}
                onClick={() => resetMutation.mutate()}
              >
                {resetMutation.isPending ? 'Resetting…' : 'Yes, Reset Rates'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
