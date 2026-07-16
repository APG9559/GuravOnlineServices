import React from 'react';
import { Affidavit, MarriageTicket } from '@/types';
import { PAPER_LABELS, AUTH_LABELS } from '@/constants';

interface AffidavitListSectionProps {
  prefillTicket: MarriageTicket | null;
  requiredAffidavitPurposes: string[];
  linkedAffs: Record<string, Affidavit>;
  activeSearchPurpose: string | null;
  affSearch: string;
  showAffDropdown: boolean;
  affidavitsResults: Affidavit[];
  selectedAffidavits: Affidavit[];
  dropdownRef: React.RefObject<HTMLDivElement>;
  selectAffidavit: (aff: Affidavit) => void;
  unlinkAffidavit: (id: string) => void;
  linkRequiredAffidavit: (purpose: string, aff: Affidavit) => void;
  unlinkRequiredAffidavit: (purpose: string) => void;
  startSearch: (purpose: string) => void;
  setAffSearch: (val: string) => void;
  setShowAffDropdown: (val: boolean) => void;
  cancelSearch: () => void;
}

export default function AffidavitListSection({
  prefillTicket,
  requiredAffidavitPurposes,
  linkedAffs,
  activeSearchPurpose,
  affSearch,
  showAffDropdown,
  affidavitsResults,
  selectedAffidavits,
  dropdownRef,
  selectAffidavit,
  unlinkAffidavit,
  linkRequiredAffidavit,
  unlinkRequiredAffidavit,
  startSearch,
  setAffSearch,
  setShowAffDropdown,
  cancelSearch,
}: AffidavitListSectionProps) {
  if (prefillTicket) {
    if (requiredAffidavitPurposes.length === 0) return null;

    return (
      <>
        <div className="section-label" style={{ marginTop: 12 }}>
          Link Executed Affidavits *
        </div>
        {requiredAffidavitPurposes.map((purpose) => {
          const linked = linkedAffs[purpose];
          const isSearching = activeSearchPurpose === purpose;

          return (
            <div className="form-group" key={purpose} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>{purpose} <span className="required-star">*</span></label>
              {linked ? (
                <div
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    background: 'var(--bg)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>
                      {linked.customerName} — {linked.phone}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {linked.affidavitNo ? `No: ${linked.affidavitNo} · ` : ''}
                      {linked.dateOfService} · ₹
                      {Number(linked.amountCharged).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => unlinkRequiredAffidavit(purpose)}
                  >
                    ✕ Unlink
                  </button>
                </div>
              ) : isSearching ? (
                <div ref={dropdownRef} style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      placeholder="Search by name or phone..."
                      value={affSearch}
                      onChange={(e) => {
                        setAffSearch(e.target.value);
                        setShowAffDropdown(true);
                      }}
                      style={{ width: '100%' }}
                      autoFocus
                    />
                    <button type="button" className="btn btn-secondary" onClick={cancelSearch}>
                      Cancel
                    </button>
                  </div>
                  {showAffDropdown && affidavitsResults.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 50,
                        background: 'var(--card-bg, #fff)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                        maxHeight: 200,
                        overflowY: 'auto',
                        marginTop: 4,
                      }}
                    >
                      {affidavitsResults.map((aff) => {
                        const isAlreadyLinked =
                          Object.values(linkedAffs).some((a) => a.id === aff.id) ||
                          selectedAffidavits.some((a) => a.id === aff.id);
                        return (
                          <div
                            key={aff.id}
                            onClick={() => {
                              if (!isAlreadyLinked) {
                                linkRequiredAffidavit(purpose, aff);
                              }
                            }}
                            style={{
                              padding: '10px 14px',
                              cursor: isAlreadyLinked ? 'not-allowed' : 'pointer',
                              borderBottom: '1px solid var(--border)',
                              fontSize: 13,
                              opacity: isAlreadyLinked ? 0.5 : 1,
                              background: isAlreadyLinked ? 'var(--bg)' : 'transparent',
                            }}
                            onMouseEnter={(e) => {
                              if (!isAlreadyLinked)
                                e.currentTarget.style.background = 'var(--bg, #f5f5f5)';
                            }}
                            onMouseLeave={(e) => {
                              if (!isAlreadyLinked)
                                e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 500,
                                display: 'flex',
                                justifyContent: 'space-between',
                              }}
                            >
                              <span>
                                {aff.customerName} — {aff.phone}
                              </span>
                              {isAlreadyLinked && (
                                <span style={{ color: 'var(--text-hint)', fontSize: 11 }}>
                                  Already Linked
                                </span>
                              )}
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                              {aff.purpose} · ₹{Number(aff.amountCharged).toLocaleString('en-IN')} ·{' '}
                              {aff.dateOfService}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {showAffDropdown && affSearch && affidavitsResults.length === 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 50,
                        background: 'var(--card-bg, #fff)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        padding: '12px 14px',
                        fontSize: 13,
                        color: 'var(--text-muted)',
                        marginTop: 4,
                      }}
                    >
                      No affidavit records found.
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                    onClick={() => startSearch(purpose)}
                  >
                    <span>🔍 Search & link executed affidavit</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Required</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </>
    );
  }

  return (
    <>
      <hr className="divider" />
      <div className="section-label">Link affidavit records</div>

      {selectedAffidavits.map((aff) => (
        <div
          key={aff.id}
          style={{
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '12px 14px',
            marginBottom: 8,
            background: 'var(--bg)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 13 }}>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>
              {aff.customerName} — {aff.phone}
            </div>
            <div style={{ color: 'var(--text-muted)' }}>
              {aff.purpose} · {PAPER_LABELS[aff.paperType]} · {AUTH_LABELS[aff.authorizerType]}
            </div>
            <div style={{ color: 'var(--primary)', fontWeight: 500, marginTop: 4 }}>
              ₹{Number(aff.amountCharged).toLocaleString('en-IN')} · {aff.dateOfService}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={() => unlinkAffidavit(aff.id)}
            style={{ flexShrink: 0 }}
          >
            ✕ Unlink
          </button>
        </div>
      ))}

      <div ref={dropdownRef} style={{ position: 'relative', marginBottom: 14 }}>
        <input
          placeholder="Search affidavit by name or phone to link..."
          value={affSearch}
          onChange={(e) => {
            setAffSearch(e.target.value);
            setShowAffDropdown(true);
          }}
          onFocus={() => affSearch && setShowAffDropdown(true)}
          style={{ width: '100%' }}
        />
        {showAffDropdown && affidavitsResults.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 50,
              background: 'var(--card-bg, #fff)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              maxHeight: 220,
              overflowY: 'auto',
              marginTop: 4,
            }}
          >
            {affidavitsResults.map((aff) => {
              const isLinked = selectedAffidavits.some((x) => x.id === aff.id);
              return (
                <div
                  key={aff.id}
                  onClick={() => !isLinked && selectAffidavit(aff)}
                  style={{
                    padding: '10px 14px',
                    cursor: isLinked ? 'not-allowed' : 'pointer',
                    borderBottom: '1px solid var(--border)',
                    fontSize: 13,
                    transition: 'background 0.15s',
                    opacity: isLinked ? 0.5 : 1,
                    background: isLinked ? 'var(--bg)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isLinked) e.currentTarget.style.background = 'var(--bg, #f5f5f5)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isLinked) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div
                    style={{ fontWeight: 500, display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span>
                      {aff.customerName} — {aff.phone}
                    </span>
                    {isLinked && (
                      <span style={{ color: 'var(--text-hint)', fontSize: 11 }}>
                        Already Linked
                      </span>
                    )}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {aff.purpose} · ₹{Number(aff.amountCharged).toLocaleString('en-IN')} ·{' '}
                    {aff.dateOfService}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {showAffDropdown && affSearch && affidavitsResults.length === 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 50,
              background: 'var(--card-bg, #fff)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '12px 14px',
              fontSize: 13,
              color: 'var(--text-muted)',
              marginTop: 4,
            }}
          >
            No affidavit records found.
          </div>
        )}
      </div>
    </>
  );
}
