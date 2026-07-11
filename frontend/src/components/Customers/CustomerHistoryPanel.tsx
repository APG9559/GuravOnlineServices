import { useState } from 'react';
import { Customer, CustomerDetails, CustomerServiceUsage } from '@/types';
import CustomerShareReceiptModal from './CustomerShareReceiptModal';

interface CustomerHistoryPanelProps {
  customerDetails: CustomerDetails | undefined;
  detailsLoading: boolean;
  onEditClick: (c: Customer) => void;
  onClose: () => void;
  onPrintReceipt: (s: CustomerServiceUsage) => void;
  isMobileModal?: boolean;
}

export default function CustomerHistoryPanel({
  customerDetails,
  detailsLoading,
  onEditClick,
  onClose,
  onPrintReceipt,
  isMobileModal = false,
}: CustomerHistoryPanelProps) {
  const [shareService, setShareService] = useState<CustomerServiceUsage | null>(null);

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        height: isMobileModal ? '100%' : 'fit-content',
        ...(isMobileModal ? { border: 'none', boxShadow: 'none', borderRadius: 0 } : {}),
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
            👤 {detailsLoading ? 'Loading profile...' : customerDetails?.name}
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Registered on {customerDetails && new Date(customerDetails.createdAt).toLocaleDateString('en-IN')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {customerDetails && (
            <button className="btn btn-sm" onClick={() => onEditClick(customerDetails)}>
              Edit Profile
            </button>
          )}
          <button className="btn btn-sm" style={{ minWidth: 32 }} onClick={onClose}>
            ✕ Close
          </button>
        </div>
      </div>

      {detailsLoading ? (
        <div style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>
          Loading details...
        </div>
      ) : customerDetails ? (
        <>
          {/* Profile Detail Badges */}
          <div className="grid-2" style={{ background: 'var(--bg)', padding: '0.75rem', borderRadius: 'var(--radius)' }}>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Mobile No.</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{customerDetails.phone}</span>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Email Address</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{customerDetails.email || '—'}</span>
            </div>
            <div style={{ gridColumn: 'span 2', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Residential Address</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{customerDetails.address || '—'}</span>
            </div>
          </div>

          <div className="divider" style={{ margin: 0 }} />

          {/* Timeline */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <h4 style={{ fontSize: 14, fontWeight: 500, marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Service History</span>
              <span className="badge badge-blue">{customerDetails.services.length} services availed</span>
            </h4>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                maxHeight: isMobileModal ? 'none' : '420px',
                overflowY: 'auto',
                paddingRight: 4,
              }}
            >
              {customerDetails.services.map((s) => (
                <div
                  key={s.id}
                  style={{
                    border: '0.5px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '10px 12px',
                    background: 'var(--surface)',
                    transition: 'box-shadow 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      className={`badge ${
                        s.type === 'marriage' ? 'badge-amber' :
                        (s.type === 'birth-death' || s.type === 'trade-license' || s.type === 'water-supply' || s.type === 'property-tax') ? 'badge-green' :
                        (s.type === 'pan-card' || s.type === 'passport') ? 'badge-red' : 'badge-blue'
                      }`}
                      style={{ fontSize: 11 }}
                    >
                      {s.typeName}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(s.dateOfService).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, margin: '8px 0', color: 'var(--text)' }}>
                    {s.description}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Charged: </span>
                      <span style={{ fontWeight: 500 }}>₹{s.amountCharged}</span>
                      <span style={{ color: 'var(--text-hint)', fontSize: 11, marginLeft: 6 }}>by {s.createdBy}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn-sm"
                        style={{ padding: '3px 8px', fontSize: 11, background: 'var(--accent-light)' }}
                        onClick={() => setShareService(s)}
                      >
                        📤 Share
                      </button>
                      <button
                        className="btn btn-sm"
                        style={{ padding: '3px 8px', fontSize: 11 }}
                        onClick={() => onPrintReceipt(s)}
                      >
                        🖨 Print
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {customerDetails.services.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '2rem' }}>
                  No service records linked to this customer yet.
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}

      {/* Share Receipt Modal */}
      {shareService && customerDetails && (
        <CustomerShareReceiptModal
          service={shareService}
          customer={customerDetails}
          onClose={() => setShareService(null)}
        />
      )}
    </div>
  );
}

