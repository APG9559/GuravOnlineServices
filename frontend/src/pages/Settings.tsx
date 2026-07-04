import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi, authApi, api } from '@/api';
import { PricingSetting } from '@/types';
import { startRegistration } from '@simplewebauthn/browser';
import { biometricService } from '@/services/biometric';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/context/AuthContext';

interface EditState {
  [key: string]: string;
}

export default function SettingsPage() {
  const qc = useQueryClient();
  const [editValues, setEditValues] = useState<EditState>({});
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const [registeringPasskey, setRegisteringPasskey] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [passkeySuccess, setPasskeySuccess] = useState(false);

  // Native biometric state (for older devices like Galaxy M30)
  const [biometricHardwareAvailable, setBiometricHardwareAvailable] = useState(false);
  const [biometricEnrolled, setBiometricEnrolled] = useState(false);
  const [biometricSaved, setBiometricSaved] = useState(false);
  const [biometricEnrolling, setBiometricEnrolling] = useState(false);
  const [biometricError, setBiometricError] = useState<string | null>(null);
  const [biometricSuccess, setBiometricSuccess] = useState(false);

  const [showPasskeyOption, setShowPasskeyOption] = useState(true);

  // Database management state
  const { isAdmin } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMode, setImportMode] = useState<'full' | 'insert'>('insert');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoreConfirmText, setRestoreConfirmText] = useState('');
  const [restoreConfirmChecked, setRestoreConfirmChecked] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setPasskeyError(null);
    setPasskeySuccess(false);
    try {
      const res = await authApi.getPasskeyRegisterOptions();
      const { options, sessionId } = res.data;
      const regResult = await startRegistration(options);
      await authApi.verifyPasskeyRegister(sessionId, regResult);
      setPasskeySuccess(true);
    } catch (err: any) {
      console.error('[Passkey Register Error]', err);
      if (err.name === 'NotAllowedError') {
        setPasskeyError('Registration cancelled or timed out.');
      } else {
        setPasskeyError(err.response?.data?.message || err.message || 'Failed to register biometric credential.');
      }
    } finally {
      setRegisteringPasskey(false);
    }
  };

  // Enroll fingerprint for native biometric login (older devices)
  const handleEnrollBiometric = async () => {
    setBiometricEnrolling(true);
    setBiometricError(null);
    setBiometricSuccess(false);
    try {
      // Trigger fingerprint dialog — if it succeeds, it means the device has an enrolled fingerprint
      const token = await biometricService.getTokenWithBiometric();
      if (!token) {
        // No saved token yet — user needs to log in with password first
        const currentToken = localStorage.getItem('token');
        if (currentToken) {
          await biometricService.saveToken(currentToken);
          setBiometricSaved(true);
          setBiometricSuccess(true);
        } else {
          setBiometricError('Session not found. Please log out and log in again to enable fingerprint login.');
        }
      } else {
        setBiometricSaved(true);
        setBiometricSuccess(true);
      }
    } catch (err: any) {
      setBiometricError(err.message || 'Failed to register fingerprint.');
    } finally {
      setBiometricEnrolling(false);
    }
  };

  const handleRemoveBiometric = async () => {
    await biometricService.deleteToken();
    setBiometricSaved(false);
    setBiometricSuccess(false);
  };

  // ── Database export handler ──────────────────────────────────────────────
  const handleExportDatabase = async () => {
    setExporting(true);
    setExportError(null);
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
    } catch (err: any) {
      // Blob responses wrap JSON errors inside the blob
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          setExportError(json.message || 'Export failed.');
        } catch { setExportError('Export failed. Check server logs.'); }
      } else {
        setExportError(err.response?.data?.message || err.message || 'Export failed.');
      }
    } finally {
      setExporting(false);
    }
  };

  // ── Database import handler ──────────────────────────────────────────────
  const handleImportDatabase = async () => {
    if (!importFile) return;
    // For full restore, require the confirmation modal first
    if (importMode === 'full' && !showRestoreConfirm) {
      setShowRestoreConfirm(true);
      return;
    }
    setShowRestoreConfirm(false);
    setRestoreConfirmText('');
    setRestoreConfirmChecked(false);
    setImporting(true);
    setImportError(null);
    setImportSuccess(null);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('mode', importMode);
      const res = await api.post('/settings/database/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300_000,
      });
      setImportSuccess(res.data?.message || res.data?.data?.message || 'Import completed successfully.');
      setImportFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setImportError(err.response?.data?.message || err.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['pricing-settings'],
    queryFn: () => settingsApi.getAll().then((r) => r.data),
    staleTime: 30_000,
  });

  // react-query v5 removed onSuccess from useQuery — use useEffect instead
  useEffect(() => {
    if (settings.length > 0) {
      const init: EditState = {};
      settings.forEach((s: PricingSetting) => { init[s.key] = String(s.value); });
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
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => settingsApi.resetDefaults().then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing-settings'] });
      qc.invalidateQueries({ queryKey: ['pricing-map'] });
      setResetConfirm(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleChange = (key: string, val: string) => {
    setEditValues((prev) => ({ ...prev, [key]: val }));
    setDirty((prev) => { const n = new Set(prev); n.add(key); return n; });
    setSaved(false);
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

  const DEFAULT_DISPLAY = [
    ['Executive Magistrate fee', '₹850'],
    ['Notary Public fee', '₹1,100'],
    ['₹500 Stamp paper cost', '₹500'],
    ['Plain paper cost', '₹0'],
    ['Online form filling', '₹300'],
    ['Offline form filling', '₹300'],
    ['Document true copy', '₹100'],
    ['Birth/Death First copy', '₹300'],
    ['Birth/Death Extra copy', '₹50'],
    ['Property Card fee', '₹100'],
    ['7/12 Card fee', '₹100'],
    ['8A Card fee', '₹100'],
    ['PAN Card - New Application Service Fee', '₹200'],
    ['PAN Card - Correction Service Fee', '₹150'],
    ['Passport - New Application Service Fee', '₹300'],
    ['Passport - Re-issue Service Fee', '₹250'],
    ['Voter Card - New Application Service Fee', '₹0'],
    ['Voter Card - Correction Service Fee', '₹0'],
    ['Voter Card - Name Deletion Service Fee', '₹0'],
    ['Voter Card - Address Change Service Fee', '₹0'],
    ['Gazette - Official Fee', '₹500'],
    ['Gazette - Service Fee', '₹150'],
  ];

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

      {saved && (
        <div className="alert-success" style={{ marginBottom: '1.25rem' }}>
          ✅ Pricing updated. All calculators and forms now use the new rates immediately.
        </div>
      )}
      {updateMutation.isError && (
        <div className="alert-error" style={{ marginBottom: '1.25rem' }}>
          Failed to save changes. Please try again.
        </div>
      )}

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
          {['affidavit', 'marriage', 'birth_death', 'property_card', 'shop_act', 'trade_license', 'csc', 'aaple_sarkar', 'water_supply', 'property_tax'].filter((g) => groups[g]).map((group) => (
            <div className="card" key={group}>
              <div style={{ fontWeight: 500, fontSize: 15, marginBottom: '1rem' }}>
                {groupLabels[group]}
              </div>
              <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '38%' }}>Rate name</th>
                    <th className="hide-mobile" style={{ width: '18%' }}>Saved rate (₹)</th>
                    <th style={{ width: '24%' }}>Edit value (₹)</th>
                    <th className="hide-mobile" style={{ width: '20%' }}>Last changed by</th>
                  </tr>
                </thead>
                <tbody>
                  {groups[group].map((s: PricingSetting) => {
                    const currentEdit = editValues[s.key] ?? String(s.value);
                    const parsedEdit = parseFloat(currentEdit);
                    const hasChanged = dirty.has(s.key) && parsedEdit !== Number(s.value);

                    return (
                      <tr key={s.key}>
                        <td>
                          <div style={{ fontWeight: 500, fontSize: 14 }}>{s.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 2 }}>{s.key}</div>
                        </td>
                        <td className="hide-mobile" style={{ fontWeight: 500 }}>
                          ₹{Number(s.value).toLocaleString('en-IN')}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>₹</span>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={currentEdit}
                              onChange={(e) => handleChange(s.key, e.target.value)}
                              className="settings-rate-input"
                              style={{
                                borderColor: hasChanged ? 'var(--accent)' : undefined,
                                background: hasChanged ? 'var(--accent-light)' : undefined,
                              }}
                            />
                            {hasChanged && (
                              <span className="badge badge-blue" style={{ fontSize: 10 }}>unsaved</span>
                            )}
                          </div>
                        </td>
                        <td className="hide-mobile" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {s.updatedBy ? (
                            <>
                              <div>{s.updatedBy.name}</div>
                              <div style={{ color: 'var(--text-hint)' }}>
                                {new Date(s.updatedAt).toLocaleDateString('en-IN', {
                                  day: '2-digit', month: 'short', year: 'numeric',
                                })}
                                {' '}
                                {new Date(s.updatedAt).toLocaleTimeString('en-IN', {
                                  hour: '2-digit', minute: '2-digit',
                                })}
                              </div>
                            </>
                          ) : (
                            <span style={{ color: 'var(--text-hint)' }}>Default — never edited</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>

              {groups[group].some((s: PricingSetting) => dirty.has(s.key)) && (
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              )}
            </div>
          ))}

          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div style={{ fontWeight: 500, fontSize: 15, marginBottom: '0.5rem' }}>
              Biometrics & Passkeys
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Set up password-free authentication to log in quickly and securely.
            </div>

            {/* Passkey Setup Section */}
            {showPasskeyOption && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>Passkeys (WebAuthn)</div>
                <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 12 }}>
                  Best for modern devices. Securely registers this device with the server.
                </div>
                {passkeyError && (
                  <div className="alert-error" style={{ marginBottom: '0.75rem', fontSize: 12, padding: '8px 12px', background: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', color: 'var(--danger)' }}>
                    ❌ {passkeyError}
                  </div>
                )}
                {passkeySuccess && (
                  <div className="alert-success" style={{ marginBottom: '0.75rem', fontSize: 12, padding: '8px 12px', background: 'rgba(74,222,128,0.15)', border: '1px solid rgb(74,222,128)', borderRadius: 'var(--radius)', color: 'rgb(22,101,52)' }}>
                    ✅ Passkey registered successfully!
                  </div>
                )}
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleRegisterPasskey}
                  disabled={registeringPasskey}
                >
                  {registeringPasskey ? 'Registering Device…' : 'Register Passkey'}
                </button>
              </div>
            )}

            {/* Native Biometric Setup Section — only visible on native mobile platform */}
            {Capacitor.isNativePlatform() && (
              <>
                <hr style={{ border: 'none', borderTop: '1px solid rgba(24,95,165,0.15)', margin: '1.5rem 0' }} />
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>
                    Fingerprint Login (Native Keystore)
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 12 }}>
                    Best for older Android devices. Saves an encrypted token locally in your device's keystore.
                  </div>

                  {!biometricHardwareAvailable ? (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', background: 'var(--accent-light)', padding: '10px 12px', borderRadius: 'var(--radius)', border: '1px solid rgba(24,95,165,0.1)' }}>
                      ℹ️ Fingerprint authentication hardware is not available or supported on this device.
                    </div>
                  ) : !biometricEnrolled ? (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', background: 'var(--accent-light)', padding: '10px 12px', borderRadius: 'var(--radius)', border: '1px solid rgba(24,95,165,0.1)' }}>
                      ⚠️ Fingerprint sensor detected, but no fingerprints are registered. Please add a fingerprint in your device's Android Settings to enable fingerprint login.
                    </div>
                  ) : (
                    <>
                      {biometricError && (
                        <div className="alert-error" style={{ marginBottom: '0.75rem', fontSize: 12, padding: '8px 12px', background: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', color: 'var(--danger)' }}>
                          ❌ {biometricError}
                        </div>
                      )}
                      {biometricSuccess && (
                        <div className="alert-success" style={{ marginBottom: '0.75rem', fontSize: 12, padding: '8px 12px', background: 'rgba(74,222,128,0.15)', border: '1px solid rgb(74,222,128)', borderRadius: 'var(--radius)', color: 'rgb(22,101,52)' }}>
                          ✅ Fingerprint authentication configured!
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                        <span style={{ fontSize: 13, color: 'var(--text)' }}>
                          Status: <strong>{biometricSaved ? 'Enabled' : 'Disabled'}</strong>
                        </span>
                        {biometricSaved ? (
                          <button
                            className="btn"
                            style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.5)', padding: '6px 12px', fontSize: 12 }}
                            onClick={handleRemoveBiometric}
                          >
                            Disable Fingerprint
                          </button>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={handleEnrollBiometric}
                            disabled={biometricEnrolling}
                          >
                            {biometricEnrolling ? 'Enrolling…' : 'Enable Fingerprint'}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ── Database Management (Admin only) ──────────────────────── */}
          {isAdmin && (
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <div style={{ fontWeight: 500, fontSize: 15, marginBottom: '0.5rem' }}>
                Database Management
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Export or import the entire database. Admin access only.
              </div>

              {/* Export Section */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>Export Database</div>
                <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 12 }}>
                  Downloads a full database backup as a <code>.dump</code> file.
                </div>
                {exportError && (
                  <div style={{ marginBottom: '0.75rem', fontSize: 12, padding: '8px 12px', background: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', color: 'var(--danger)' }}>
                    ❌ {exportError}
                  </div>
                )}
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleExportDatabase}
                  disabled={exporting}
                >
                  {exporting ? 'Exporting…' : '⬇ Export Database'}
                </button>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid rgba(24,95,165,0.15)', margin: '1.5rem 0' }} />

              {/* Import Section */}
              <div>
                <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>Import Database</div>
                <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 12 }}>
                  Upload a previously exported <code>.dump</code> file to restore data.
                </div>

                {importError && (
                  <div style={{ marginBottom: '0.75rem', fontSize: 12, padding: '8px 12px', background: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', color: 'var(--danger)' }}>
                    ❌ {importError}
                  </div>
                )}
                {importSuccess && (
                  <div style={{ marginBottom: '0.75rem', fontSize: 12, padding: '8px 12px', background: 'rgba(74,222,128,0.15)', border: '1px solid rgb(74,222,128)', borderRadius: 'var(--radius)', color: 'rgb(22,101,52)' }}>
                    ✅ {importSuccess}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
                  {/* Mode Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, minWidth: 50 }}>Mode:</label>
                    <select
                      value={importMode}
                      onChange={(e) => setImportMode(e.target.value as 'full' | 'insert')}
                      style={{
                        padding: '6px 10px', fontSize: 13, borderRadius: 'var(--radius)',
                        border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)',
                      }}
                    >
                      <option value="insert">Insert Only — add missing records, keep existing data</option>
                      <option value="full">Full Restore — replace ALL data (destructive)</option>
                    </select>
                  </div>

                  {importMode === 'full' && (
                    <div style={{
                      fontSize: 12, padding: '8px 12px',
                      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: 'var(--radius)', color: 'var(--danger)',
                    }}>
                      ⚠️ <strong>Full Restore</strong> will drop all existing tables and replace them with the data from the uploaded file.
                    </div>
                  )}

                  {/* File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".dump"
                    onChange={(e) => {
                      setImportFile(e.target.files?.[0] || null);
                      setImportError(null);
                      setImportSuccess(null);
                    }}
                    style={{ fontSize: 13 }}
                  />

                  {importFile && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Selected: <strong>{importFile.name}</strong> ({(importFile.size / 1024).toFixed(1)} KB)
                    </div>
                  )}

                  <button
                    className={`btn btn-sm ${importMode === 'full' ? 'btn-danger' : 'btn-primary'}`}
                    onClick={handleImportDatabase}
                    disabled={!importFile || importing}
                  >
                    {importing ? 'Importing…' : importMode === 'full' ? '⬆ Full Restore' : '⬆ Import Data'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reset confirmation modal */}
      {resetConfirm && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.35)',
          zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}>
          <div className="card modal-card" style={{ width: '100%', maxWidth: 420 }}>
            <div style={{ fontWeight: 500, fontSize: 16, marginBottom: 10 }}>
              Reset all rates to defaults?
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: '1rem' }}>
              This will restore every rate to its original value:
            </div>
            <table style={{ fontSize: 13, marginBottom: '1.25rem' }}>
              <tbody>
                {DEFAULT_DISPLAY.map(([label, val]) => (
                  <tr key={label}>
                    <td style={{ padding: '4px 0', color: 'var(--text-muted)' }}>{label}</td>
                    <td style={{ padding: '4px 0', fontWeight: 500, textAlign: 'right' }}>{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-danger"
                onClick={() => resetMutation.mutate()}
                disabled={resetMutation.isPending}
              >
                {resetMutation.isPending ? 'Resetting…' : 'Yes, reset to defaults'}
              </button>
              <button className="btn" onClick={() => setResetConfirm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Full Restore confirmation modal */}
      {showRestoreConfirm && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.35)',
          zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}>
          <div className="card modal-card" style={{ width: '100%', maxWidth: 460 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 10, color: 'var(--danger)' }}>
              ⚠️ Full Database Restore
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: '1rem' }}>
              This will <strong>permanently delete ALL existing data</strong> in the database and replace it
              with the contents of <strong>{importFile?.name}</strong>.
            </div>
            <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: '1rem' }}>
              This action <strong>cannot be undone</strong>. Make sure you have exported a backup first.
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, marginBottom: '1rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={restoreConfirmChecked}
                onChange={(e) => setRestoreConfirmChecked(e.target.checked)}
                style={{ marginTop: 2 }}
              />
              I understand that all current data will be permanently replaced.
            </label>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: 13, marginBottom: 6 }}>Type <strong>RESTORE</strong> to confirm:</div>
              <input
                type="text"
                value={restoreConfirmText}
                onChange={(e) => setRestoreConfirmText(e.target.value)}
                placeholder="RESTORE"
                style={{
                  padding: '8px 12px', fontSize: 14, width: '100%',
                  borderRadius: 'var(--radius)', border: '1px solid var(--border)',
                  background: 'var(--bg)', color: 'var(--text)',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-danger"
                disabled={!restoreConfirmChecked || restoreConfirmText !== 'RESTORE'}
                onClick={handleImportDatabase}
              >
                Yes, restore database
              </button>
              <button
                className="btn"
                onClick={() => {
                  setShowRestoreConfirm(false);
                  setRestoreConfirmText('');
                  setRestoreConfirmChecked(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
