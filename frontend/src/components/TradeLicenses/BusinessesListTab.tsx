import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tradeLicensesApi } from '@/api';
import { Business, TradeLicenseRecord, SERVICE_TYPE_LABELS } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface BusinessesListTabProps {
  startServiceForBusiness: (biz: Business, service: TradeLicenseRecord['serviceType']) => void;
}

export default function BusinessesListTab({ startServiceForBusiness }: BusinessesListTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingBusinessId, setViewingBusinessId] = useState<string | null>(null);
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

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

  const verifyCertificateMutation = useMutation({
    mutationFn: ({ businessId, data }: { businessId: string; data: any }) =>
      tradeLicensesApi.updateCompletionCertificate(businessId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trade-businesses'] });
      queryClient.invalidateQueries({ queryKey: ['trade-business-details', viewingBusinessId] });
    },
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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                  {(viewingBusinessDetails.trades && viewingBusinessDetails.trades.length > 0)
                    ? viewingBusinessDetails.trades.map((t: any, i: number) => (
                      <span key={t.id || i} className="badge badge-blue" style={{ fontSize: 11 }}>
                        {t.tradeType} / {t.tradeSubtype}
                      </span>
                    ))
                    : viewingBusinessDetails.tradeType && (
                      <span className="badge badge-blue" style={{ fontSize: 11 }}>
                        {viewingBusinessDetails.tradeType} / {viewingBusinessDetails.tradeSubtype}
                      </span>
                    )
                  }
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
            <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 8 }}>Building Completion Certificate</div>
            <div style={{
              padding: 12,
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              background: 'var(--bg-card-hover)',
              marginBottom: 14,
              fontSize: 13,
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>Status:</strong>{' '}
                  <span className={`badge ${viewingBusinessDetails.completionCertificateStatus === 'Available' ? 'badge-green' : 'badge-danger'}`}>
                    {viewingBusinessDetails.completionCertificateStatus}
                  </span>
                </div>
                <div>
                  <strong>Verification:</strong>{' '}
                  <span className={`badge ${
                    viewingBusinessDetails.completionCertificateVerificationStatus === 'Verified'
                      ? 'badge-green'
                      : viewingBusinessDetails.completionCertificateVerificationStatus === 'Pending'
                        ? 'badge-amber'
                        : 'badge-danger'
                  }`}>
                    {viewingBusinessDetails.completionCertificateVerificationStatus === 'Not_Submitted' ? 'Not Submitted' : viewingBusinessDetails.completionCertificateVerificationStatus}
                  </span>
                </div>
              </div>
              
              <div className="grid-2" style={{ gap: '8px 16px' }}>
                <div>
                  <strong>Date of Submission:</strong>{' '}
                  {viewingBusinessDetails.completionCertificateSubmittedAt 
                    ? new Date(viewingBusinessDetails.completionCertificateSubmittedAt).toLocaleDateString('en-IN')
                    : '—'
                  }
                </div>
                <div>
                  <strong>Date of Verification:</strong>{' '}
                  {viewingBusinessDetails.completionCertificateVerifiedAt 
                    ? new Date(viewingBusinessDetails.completionCertificateVerifiedAt).toLocaleDateString('en-IN')
                    : '—'
                  }
                </div>
              </div>

              {/* Admin Actions */}
              {isAdmin && viewingBusinessDetails.completionCertificateVerificationStatus !== 'Verified' && (
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-sm btn-primary"
                    disabled={verifyCertificateMutation.isPending}
                    onClick={() => {
                      verifyCertificateMutation.mutate({
                        businessId: viewingBusinessDetails.id,
                        data: {
                          status: 'Available',
                          verificationStatus: 'Verified',
                        }
                      });
                    }}
                  >
                    {verifyCertificateMutation.isPending ? 'Verifying...' : 'Verify Certificate'}
                  </button>
                  {viewingBusinessDetails.completionCertificateStatus === 'Not Available' && (
                    <button
                      className="btn btn-sm"
                      disabled={verifyCertificateMutation.isPending}
                      onClick={() => {
                        verifyCertificateMutation.mutate({
                          businessId: viewingBusinessDetails.id,
                          data: {
                            status: 'Available',
                            verificationStatus: 'Pending',
                            submittedAt: new Date().toISOString().split('T')[0],
                          }
                        });
                      }}
                    >
                      Mark Submitted (Pending Verification)
                    </button>
                  )}
                </div>
              )}
            </div>

            <hr className="divider" style={{ margin: '1rem 0' }} />
            <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 8 }}>Tenant & Security Deposit Details</div>
            <div style={{
              padding: 12,
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              background: 'var(--bg-card-hover)',
              marginBottom: 14,
              fontSize: 13,
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}>
              <div className="grid-2" style={{ gap: '8px 16px' }}>
                <div>
                  <strong>Tenant Status:</strong>{' '}
                  <span className={`badge ${viewingBusinessDetails.isTenant ? 'badge-amber' : 'badge-green'}`}>
                    {viewingBusinessDetails.isTenant ? 'Yes (Tenant)' : 'No (Owner)'}
                  </span>
                </div>
                <div>
                  <strong>Deposit Fee Charged:</strong>{' '}
                  <span className={`badge ${viewingBusinessDetails.depositFeeCharged ? 'badge-green' : 'badge-secondary'}`}>
                    {viewingBusinessDetails.depositFeeCharged ? 'Charged' : 'Not Charged'}
                  </span>
                </div>
              </div>

              <div className="grid-2" style={{ gap: '8px 16px' }}>
                <div>
                  <strong>Deposit Amount:</strong>{' '}
                  {Number(viewingBusinessDetails.depositFeeAmount) > 0 
                    ? `₹${Number(viewingBusinessDetails.depositFeeAmount).toLocaleString('en-IN')}`
                    : '₹0'
                  }
                </div>
                <div>
                  <strong>Collection Date:</strong>{' '}
                  {viewingBusinessDetails.depositFeeCollectionDate 
                    ? new Date(viewingBusinessDetails.depositFeeCollectionDate).toLocaleDateString('en-IN')
                    : '—'
                  }
                </div>
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
