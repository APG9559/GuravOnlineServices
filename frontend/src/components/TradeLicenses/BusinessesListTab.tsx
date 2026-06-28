import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tradeLicensesApi } from '@/api';
import { Business, TradeLicenseRecord, SERVICE_TYPE_LABELS } from '@/types';

interface BusinessesListTabProps {
  startServiceForBusiness: (biz: Business, service: TradeLicenseRecord['serviceType']) => void;
}

export default function BusinessesListTab({ startServiceForBusiness }: BusinessesListTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingBusinessId, setViewingBusinessId] = useState<string | null>(null);

  // Queries
  const { data: businesses = [], isLoading: businessesLoading } = useQuery({
    queryKey: ['trade-businesses', searchQuery],
    queryFn: () => tradeLicensesApi.getAllBusinesses({ search: searchQuery }).then((r) => r.data),
  });

  const { data: viewingBusinessDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['trade-business-details', viewingBusinessId],
    queryFn: () => viewingBusinessId ? tradeLicensesApi.getBusinessDetails(viewingBusinessId).then((r) => r.data) : null,
    enabled: !!viewingBusinessId,
  });

  return (
    <div className="grid-2">
      {/* List panel */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
          <input
            className="search-input"
            style={{ width: '100%', margin: 0 }}
            placeholder="Search business name, phone, license..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {businessesLoading ? (
          <div style={{ padding: 20, color: 'var(--text-muted)' }}>Loading...</div>
        ) : businesses.length === 0 ? (
          <div style={{ padding: 20, color: 'var(--text-muted)' }}>No businesses found.</div>
        ) : (
          <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <table style={{ margin: 0, width: '100%' }}>
              <thead>
                <tr>
                  <th>Business Name</th>
                  <th>License Number</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((b) => (
                  <tr
                    key={b.id}
                    className={viewingBusinessId === b.id ? 'active-row' : ''}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setViewingBusinessId(b.id)}
                  >
                    <td style={{ fontWeight: 500 }}>{b.name}</td>
                    <td>
                      {b.licenseNo ? (
                        <span className="badge badge-green">{b.licenseNo}</span>
                      ) : (
                        <span className="badge badge-amber">Pending</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${b.status === 'Approved'
                          ? 'badge-green'
                          : b.status === 'Cancelled'
                            ? 'badge-danger'
                            : 'badge-amber'
                          }`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details panel */}
      <div className="card">
        {detailsLoading ? (
          <div style={{ color: 'var(--text-muted)' }}>Loading details...</div>
        ) : viewingBusinessDetails ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18 }}>{viewingBusinessDetails.name}</h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Trade: {viewingBusinessDetails.tradeType} ({viewingBusinessDetails.tradeSubtype})
                </div>
              </div>
              <span
                className={`badge ${viewingBusinessDetails.status === 'Approved'
                  ? 'badge-green'
                  : viewingBusinessDetails.status === 'Cancelled'
                    ? 'badge-danger'
                    : 'badge-amber'
                  }`}
                style={{ fontSize: 13, padding: '4px 10px' }}
              >
                {viewingBusinessDetails.status}
              </span>
            </div>

            <div className="grid-2" style={{ marginBottom: 14, fontSize: 13 }}>
              <div>
                <strong>License Number:</strong>{' '}
                {viewingBusinessDetails.licenseNo ? (
                  <span className="badge badge-green">{viewingBusinessDetails.licenseNo}</span>
                ) : (
                  'Not Approved Yet'
                )}
              </div>
              <div>
                <strong>Last Renewal Year:</strong> {viewingBusinessDetails.lastRenewalYear || '—'}
              </div>
              <div>
                <strong>Mobile Number:</strong> {viewingBusinessDetails.phone || '—'}
              </div>
              <div>
                <strong>Email:</strong> {viewingBusinessDetails.email || '—'}
              </div>
            </div>

            <hr className="divider" style={{ margin: '1rem 0' }} />
            <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 8 }}>Associated Partners</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '1.25rem' }}>
              {viewingBusinessDetails.customers?.map((c: any) => (
                <span key={c.id} className="badge badge-blue" style={{ padding: '6px 12px', fontSize: 12 }}>
                  👤 {c.name} ({c.phone})
                </span>
              ))}
            </div>

            <hr className="divider" style={{ margin: '1rem 0' }} />
            <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 8 }}>Availed Services History</div>
            {viewingBusinessDetails.records?.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No records logged.</div>
            ) : (
              <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                <table style={{ margin: 0, fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Service Type</th>
                      <th>Charged</th>
                      <th>By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingBusinessDetails.records?.map((rec: any) => (
                      <tr key={rec.id}>
                        <td>{rec.dateOfService}</td>
                        <td>
                          <span className="badge badge-blue">
                            {SERVICE_TYPE_LABELS[rec.serviceType] || rec.serviceType}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500 }}>₹{Number(rec.amountCharged).toLocaleString('en-IN')}</td>
                        <td>{rec.createdBy?.name || 'System'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Action Shortcuts */}
            {viewingBusinessDetails.status !== 'Cancelled' && (
              <>
                <hr className="divider" style={{ margin: '1rem 0' }} />
                <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 8 }}>Quick Service Shortcuts</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <button
                    className="btn btn-sm"
                    onClick={() => startServiceForBusiness(viewingBusinessDetails, 'Renew')}
                  >
                    Renew License
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => startServiceForBusiness(viewingBusinessDetails, 'Transfer_Heir')}
                  >
                    Transfer to Heir
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => startServiceForBusiness(viewingBusinessDetails, 'Transfer_Third_Party')}
                  >
                    Transfer to Third Party
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => startServiceForBusiness(viewingBusinessDetails, 'Name_Change')}
                  >
                    Change Business Name
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => startServiceForBusiness(viewingBusinessDetails, 'Trade_Change')}
                  >
                    Change Trade Category
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => startServiceForBusiness(viewingBusinessDetails, 'Partner_Change')}
                  >
                    Amend Partners
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => {
                      if (confirm('Cancel this business license?')) {
                        startServiceForBusiness(viewingBusinessDetails, 'Cancel');
                      }
                    }}
                  >
                    Cancel Trade License
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            Select a business from the list to view its full details and service history.
          </div>
        )}
      </div>
    </div>
  );
}
