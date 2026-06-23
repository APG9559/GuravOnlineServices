import { useMemo, useEffect } from 'react';
import { PaperType, AuthorizerType } from '@/types';
import { calcAffidavitTotal } from '@/hooks/usePricing';
import NeoSelect from '@/components/NeoSelect';

interface SituationBlockProps {
  label: string;
  radioLabel: [string, string];
  entry: {
    yes?: boolean;
    available?: boolean;
    affidavit?: string;
    paperType?: PaperType;
    authorizer?: AuthorizerType;
    amountCharged?: number;
    remark?: string;
    customerName?: string;
    customerBroughtStamp?: boolean;
  };
  triggerOnValue: boolean;
  onChange: (updated: any) => void;
  pricing: Record<string, number>;
  showNameInput?: boolean;
  nameInputLabel?: string;
}

export default function SituationBlock({
  label,
  radioLabel,
  entry,
  triggerOnValue,
  onChange,
  pricing,
  showNameInput,
  nameInputLabel = "Affidavit Name *",
}: SituationBlockProps) {
  const currentVal = entry.yes !== undefined ? entry.yes : entry.available;
  const needsAffidavit = currentVal === triggerOnValue;
  const affYes = entry.affidavit === 'Yes';
  const fieldKey = entry.yes !== undefined ? 'yes' : 'available';

  const calcAmount = useMemo(() => {
    if (!affYes || !entry.paperType || !entry.authorizer) return 0;
    const res = calcAffidavitTotal(entry.paperType, entry.authorizer, pricing);
    if (entry.paperType === 'stamp500' && entry.customerBroughtStamp === true) {
      return res.authFee;
    }
    return res.total;
  }, [affYes, entry.paperType, entry.authorizer, entry.customerBroughtStamp, pricing]);

  const isDiscounted = affYes && !!entry.paperType && !!entry.authorizer && entry.amountCharged !== undefined && entry.amountCharged < calcAmount;

  useEffect(() => {
    if (!isDiscounted && entry.remark) {
      onChange({ ...entry, remark: undefined });
    }
  }, [isDiscounted, entry.remark, entry, onChange]);

  return (
    <div style={{ marginBottom: 16, padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)' }}>
      <div style={{ fontWeight: 500, marginBottom: 8, fontSize: 14 }}>{label}</div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: needsAffidavit ? 10 : 0 }}>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
          <input type="radio" checked={currentVal === true} onChange={() => onChange({ [fieldKey]: true, affidavit: 'No' })} />
          {radioLabel[0]}
        </label>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
          <input type="radio" checked={currentVal === false} onChange={() => onChange({ [fieldKey]: false, affidavit: 'No' })} />
          {radioLabel[1]}
        </label>
      </div>

      {needsAffidavit && (
        <>
          <div className="form-group" style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 12 }}>Need affidavit?</label>
            <NeoSelect
              value={entry.affidavit || 'No'}
              onChange={(val) => onChange({ ...entry, affidavit: val, paperType: undefined, authorizer: undefined, amountCharged: undefined, customerName: undefined, customerBroughtStamp: undefined })}
              options={[
                { value: 'No', label: 'No' },
                { value: 'Yes', label: 'Yes' },
                { value: 'Combined with other', label: 'Combined with other' }
              ]}
            />
          </div>

          {affYes && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {showNameInput && (
                <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 8 }}>
                  <label style={{ fontSize: 12 }}>{nameInputLabel}</label>
                  <input
                    type="text"
                    value={entry.customerName || ''}
                    onChange={(e) => onChange({ ...entry, customerName: e.target.value })}
                    placeholder="Enter name for affidavit"
                    style={{ fontSize: 13 }}
                  />
                  {!entry.customerName?.trim() && (
                    <span style={{ color: 'var(--danger)', fontSize: 11, display: 'block', marginTop: 4 }}>
                      ⚠ Name is required for this affidavit.
                    </span>
                  )}
                </div>
              )}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 12 }}>Paper type</label>
                <NeoSelect
                  value={entry.paperType || ''}
                  onChange={(val) => {
                    const pt = val as PaperType;
                    const res = calcAffidavitTotal(pt, entry.authorizer || 'magistrate', pricing);
                    onChange({
                      ...entry,
                      paperType: pt,
                      customerBroughtStamp: pt === 'stamp500' ? false : undefined,
                      amountCharged: res.total
                    });
                  }}
                  options={[
                    { value: 'stamp500', label: '₹500 Stamp Paper' },
                    { value: 'Plain', label: 'Plain Paper' }
                  ]}
                  placeholder="Select"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 12 }}>Authorizer</label>
                <NeoSelect
                  value={entry.authorizer || ''}
                  onChange={(val) => {
                    const auth = val as AuthorizerType;
                    const res = calcAffidavitTotal(entry.paperType || 'stamp500', auth, pricing);
                    const newCalc = (entry.paperType === 'stamp500' && entry.customerBroughtStamp === true) ? res.authFee : res.total;
                    onChange({ ...entry, authorizer: auth, amountCharged: newCalc });
                  }}
                  options={[
                    { value: 'magistrate', label: 'Executive Magistrate' },
                    { value: 'Notary', label: 'Notary Public' }
                  ]}
                  placeholder="Select"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 12 }}>Amount (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={entry.amountCharged ?? calcAmount}
                  onChange={(e) => onChange({ ...entry, amountCharged: Number(e.target.value) })}
                  style={{ fontSize: 13 }}
                />
              </div>
              {entry.paperType === 'stamp500' && (
                <div className="form-group" style={{ gridColumn: 'span 3', marginTop: 8, marginBottom: 0 }}>
                  <label style={{ fontSize: 12 }}>Stamp? *</label>
                  <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
                    <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer', fontSize: 13 }}>
                      <input
                        type="radio"
                        checked={entry.customerBroughtStamp === true}
                        onChange={() => {
                          const res = calcAffidavitTotal(entry.paperType || 'stamp500', entry.authorizer || 'magistrate', pricing);
                          onChange({ ...entry, customerBroughtStamp: true, amountCharged: res.authFee });
                        }}
                      />
                      Without Stamp
                    </label>
                    <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer', fontSize: 13 }}>
                      <input
                        type="radio"
                        checked={entry.customerBroughtStamp !== true}
                        onChange={() => {
                          const res = calcAffidavitTotal(entry.paperType || 'stamp500', entry.authorizer || 'magistrate', pricing);
                          onChange({ ...entry, customerBroughtStamp: false, amountCharged: res.total });
                        }}
                      />
                      With Stamp
                    </label>
                  </div>
                </div>
              )}
              {isDiscounted && (
                <div className="form-group" style={{ gridColumn: 'span 3', marginTop: 8, marginBottom: 0 }}>
                  <label style={{ fontSize: 12 }}>Remark (Reason for discount) *</label>
                  <input
                    type="text"
                    value={entry.remark || ''}
                    onChange={(e) => onChange({ ...entry, remark: e.target.value })}
                    placeholder="Reason for charging less than standard rate"
                    style={{ fontSize: 13 }}
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
