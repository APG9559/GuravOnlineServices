import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/api';
import { PricingSetting } from '@/types';

interface EditState {
  [key: string]: string;
}

export default function SettingsPage() {
  const qc = useQueryClient();
  const [editValues, setEditValues] = useState<EditState>({});
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

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
      if (!isNaN(num) && num >= 0) updates[key] = num;
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
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Pricing Settings</div>
        <div style={{ display: 'flex', gap: 8 }}>
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
        color: 'var(--accent-text)',
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
          {['affidavit', 'marriage', 'birth_death', 'property_card', 'shop_act'].filter((g) => groups[g]).map((group) => (
            <div className="card" key={group}>
              <div style={{ fontWeight: 500, fontSize: 15, marginBottom: '1rem' }}>
                {groupLabels[group]}
              </div>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '38%' }}>Rate name</th>
                    <th style={{ width: '18%' }}>Saved rate (₹)</th>
                    <th style={{ width: '24%' }}>Edit value (₹)</th>
                    <th style={{ width: '20%' }}>Last changed by</th>
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
                        <td style={{ fontWeight: 500 }}>
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
                              style={{
                                width: 100,
                                borderColor: hasChanged ? 'var(--accent)' : undefined,
                                background: hasChanged ? 'var(--accent-light)' : undefined,
                              }}
                            />
                            {hasChanged && (
                              <span className="badge badge-blue" style={{ fontSize: 10 }}>unsaved</span>
                            )}
                          </div>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
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

              {groups[group].some((s: PricingSetting) => dirty.has(s.key)) && (
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              )}
            </div>
          ))}
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
    </div>
  );
}
