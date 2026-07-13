import { PricingSetting } from '@/types';

interface PricingCardProps {
  group: string;
  groupLabel: string;
  groupSettings: PricingSetting[];
  editValues: Record<string, string>;
  dirty: Set<string>;
  handleChange: (key: string, val: string) => void;
  handleSave: () => void;
  isSaving: boolean;
}

export default function PricingCard({
  group: _group,
  groupLabel,
  groupSettings,
  editValues,
  dirty,
  handleChange,
  handleSave,
  isSaving,
}: PricingCardProps) {
  return (
    <div className="card">
      <div style={{ fontWeight: 500, fontSize: 15, marginBottom: '1rem' }}>{groupLabel}</div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th style={{ width: '38%' }}>Rate name</th>
              <th className="hide-mobile" style={{ width: '18%' }}>
                Saved rate (₹)
              </th>
              <th style={{ width: '24%' }}>Edit value (₹)</th>
              <th className="hide-mobile" style={{ width: '20%' }}>
                Last changed by
              </th>
            </tr>
          </thead>
          <tbody>
            {groupSettings.map((s: PricingSetting) => {
              const currentEdit = editValues[s.key] ?? String(s.value);
              const parsedEdit = parseFloat(currentEdit);
              const hasChanged = dirty.has(s.key) && parsedEdit !== Number(s.value);

              return (
                <tr key={s.key}>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 2 }}>
                      {s.key}
                    </div>
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
                        <span className="badge badge-blue" style={{ fontSize: 10 }}>
                          unsaved
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="hide-mobile" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {s.updatedBy ? (
                      <>
                        <div>{s.updatedBy.name}</div>
                        <div style={{ color: 'var(--text-hint)' }}>
                          {new Date(s.updatedAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}{' '}
                          {new Date(s.updatedAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
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

      {groupSettings.some((s: PricingSetting) => dirty.has(s.key)) && (
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      )}
    </div>
  );
}
