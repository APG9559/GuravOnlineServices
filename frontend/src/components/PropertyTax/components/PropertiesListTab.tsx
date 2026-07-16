import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyTaxesApi } from '@/api';
import { Property, PropertyTaxRecord } from '@/types';
import { PROPERTY_TAX_SERVICE_TYPE_LABELS } from '@/constants';
import Modal from '@/components/Modal';
import { useAuth } from '@/context/AuthContext';

interface ActionItem {
  label: string;
  icon?: string;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'success' | 'primary';
  dividerBefore?: boolean;
}

function ActionsDropdown({ items }: { items: ActionItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const toggleDropdown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (open) {
      setOpen(false);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({ top: rect.bottom + 4, left: Math.max(10, rect.right - 200) });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const mountTime = Date.now();
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleScrollOrResize = () => {
      if (Date.now() - mountTime > 100) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [open]);

  const variantColor = (v?: ActionItem['variant']) => {
    if (v === 'danger') return 'var(--danger)';
    if (v === 'success') return 'var(--success)';
    if (v === 'primary') return '#2563eb';
    return 'var(--text)';
  };

  return (
    <div ref={ref} style={{ display: 'inline-block' }}>
      <button
        className="btn btn-sm"
        onClick={toggleDropdown}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontWeight: 700,
          letterSpacing: 1,
          minWidth: 36,
          justifyContent: 'center',
        }}
        title="Actions"
      >
        ⋯
      </button>
      {open && (
        <div
          style={{
            position: 'fixed',
            left: coords.left,
            top: coords.top,
            zIndex: 10000,
            background: 'var(--surface)',
            border: '2.5px solid var(--border)',
            borderRadius: 'var(--radius)',
            boxShadow: '4px 4px 0px var(--border)',
            minWidth: 200,
            overflow: 'hidden',
          }}
        >
          {items.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '9px 14px',
                fontSize: 13,
                fontWeight: 600,
                color: variantColor(item.variant),
                background: 'transparent',
                border: 'none',
                borderTop: item.dividerBefore ? '1.5px solid var(--border-light)' : undefined,
                cursor: 'pointer',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {item.icon && <span style={{ marginRight: 6 }}>{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PropertiesListTab() {
  const qc = useQueryClient();
  const { isAdmin, user } = useAuth();
  const hasApproveAccess = isAdmin || user?.role === 'operator';

  const [searchQuery, setSearchQuery] = useState('');
  const [approvingProperty, setApprovingProperty] = useState<Property | null>(null);
  const [propertyTaxNo, setPropertyTaxNo] = useState('');
  const [approveError, setApproveError] = useState('');
  const [viewingProperty, setViewingProperty] = useState<Property | null>(null);

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['property-tax-properties', searchQuery],
    queryFn: () => propertyTaxesApi.getProperties({ search: searchQuery }).then((r) => r.data),
    staleTime: 5000,
  });

  const { data: propertyDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['property-tax-property-details', viewingProperty?.id],
    queryFn: () => propertyTaxesApi.getPropertyDetails(viewingProperty!.id).then((r) => r.data),
    enabled: !!viewingProperty,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, propertyTaxNo }: { id: string; propertyTaxNo: string }) =>
      propertyTaxesApi.approveProperty(id, propertyTaxNo).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['property-tax-properties'] });
      qc.invalidateQueries({ queryKey: ['property-tax-records'] });
      setApprovingProperty(null);
      setPropertyTaxNo('');
      setApproveError('');
    },
    onError: (err: unknown) => {
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      setApproveError(errObj.response?.data?.message || errObj.message || 'Failed to approve property');
    },
  });

  const handleApproveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApproveError('');
    if (!propertyTaxNo.trim()) {
      setApproveError('Property Tax Number is required');
      return;
    }
    approveMutation.mutate({ id: approvingProperty!.id, propertyTaxNo: propertyTaxNo.trim() });
  };

  const badgeClass = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'badge-success';
      case 'Active':
        return 'badge-warning';
      case 'Inactive':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  if (isLoading && properties.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading properties...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          placeholder="Search by property tax no, address, customer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          style={{ maxWidth: 400 }}
        />
      </div>

      <div
        style={{
          border: '3.5px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: '4px 4px 0 var(--border)',
          overflow: 'visible',
          position: 'relative',
        }}
      >
        <div
          className="table-responsive"
          style={{ borderRadius: 'calc(var(--radius) - 3px)', overflow: 'hidden' }}
        >
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Property Tax No</th>
                <th>Address</th>
                <th>Customer Name</th>
                <th>Phone</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}
                  >
                    No properties found.
                  </td>
                </tr>
              ) : (
                properties.map((p: Property, idx: number) => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{idx + 1}</td>
                    <td style={{ fontWeight: 700 }}>{p.propertyTaxNo}</td>
                    <td>
                      <div
                        style={{
                          maxWidth: 200,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={p.address}
                      >
                        {p.address}
                      </div>
                    </td>
                    <td>{p.customer?.name || '—'}</td>
                    <td>{p.customer?.phone || '—'}</td>
                    <td>
                      <span className={`badge ${badgeClass(p.status)}`}>{p.status}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <ActionsDropdown
                        items={[
                          {
                            label: 'View Details',
                            icon: '👤',
                            onClick: () => setViewingProperty(p),
                          },
                          ...(p.status !== 'Approved' && hasApproveAccess
                            ? [
                                {
                                  label: 'Approve Property',
                                  icon: '✅',
                                  variant: 'primary' as const,
                                  dividerBefore: true,
                                  onClick: () => {
                                    setApprovingProperty(p);
                                    setPropertyTaxNo(p.propertyTaxNo || '');
                                  },
                                },
                              ]
                            : []),
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval Modal */}
      {approvingProperty && (
        <Modal title="Approve Property" onClose={() => setApprovingProperty(null)}>
          <form
            onSubmit={handleApproveSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 12 }}>
                Address
              </span>
              <span style={{ fontWeight: 700 }}>{approvingProperty.address}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 12 }}>
                Customer
              </span>
              <span style={{ fontWeight: 500 }}>
                {approvingProperty.customer?.name || 'No customer linked'}
              </span>
            </div>

            {approveError && <div className="alert-error">{approveError}</div>}

            <div className="form-group">
              <label>Property Tax Number <span className="required-star">*</span></label>
              <input
                type="text"
                value={propertyTaxNo}
                onChange={(e) => setPropertyTaxNo(e.target.value)}
                placeholder="e.g. PT/2026/001"
                required
              />
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={approveMutation.isPending}
                style={{ flex: 1 }}
              >
                {approveMutation.isPending ? 'Saving...' : 'Approve Property'}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setApprovingProperty(null)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Property Details Modal */}
      {viewingProperty && (
        <Modal
          title={`Property — ${viewingProperty.propertyTaxNo}`}
          onClose={() => setViewingProperty(null)}
        >
          {detailsLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>Loading property details...</div>
          ) : propertyDetails ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Property & Customer Info */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  borderBottom: '2.5px solid var(--border)',
                  paddingBottom: '16px',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 12 }}>
                    Property Tax No
                  </span>
                  <span style={{ fontWeight: 700 }}>{propertyDetails.propertyTaxNo}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 12 }}>
                    Status
                  </span>
                  <span className={`badge ${badgeClass(propertyDetails.status)}`}>
                    {propertyDetails.status}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 12 }}>
                    Address
                  </span>
                  <span>{propertyDetails.address}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 12 }}>
                    Customer Name
                  </span>
                  <span>{propertyDetails.customer?.name || '—'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 12 }}>
                    Phone
                  </span>
                  <span>{propertyDetails.customer?.phone || '—'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 12 }}>
                    Registered
                  </span>
                  <span>
                    {new Date(propertyDetails.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Service Record History */}
              <div>
                <h4
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    marginBottom: 12,
                    textTransform: 'uppercase',
                  }}
                >
                  Service Records
                </h4>
                <div
                  className="table-responsive"
                  style={{
                    border: '2px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    overflow: 'hidden',
                  }}
                >
                  <table className="table table-sm" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>Service Type</th>
                        <th>Date of Service</th>
                        <th style={{ textAlign: 'right' }}>Official Fee</th>
                        <th style={{ textAlign: 'right' }}>Service Fee</th>
                        <th style={{ textAlign: 'right' }}>Protocol Fee</th>
                        <th style={{ textAlign: 'right' }}>Total Charged</th>
                        <th style={{ textAlign: 'right' }}>Total Paid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(propertyDetails.records || []).length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            style={{
                              textAlign: 'center',
                              padding: '1.5rem',
                              color: 'var(--text-muted)',
                            }}
                          >
                            No service records found.
                          </td>
                        </tr>
                      ) : (
                        (propertyDetails.records || []).map((r: PropertyTaxRecord) => {
                          const totalPaid = (r.payments || []).reduce(
                            (sum: number, p) => sum + Number(p.amount),
                            0,
                          );
                          return (
                            <tr key={r.id}>
                              <td style={{ fontWeight: 600 }}>
                                {PROPERTY_TAX_SERVICE_TYPE_LABELS[r.serviceType] || r.serviceType}
                              </td>
                              <td>{r.dateOfService}</td>
                              <td style={{ textAlign: 'right' }}>
                                ₹{Number(r.officialFee).toLocaleString('en-IN')}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                ₹{Number(r.serviceFee).toLocaleString('en-IN')}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                ₹{Number(r.protocolFee).toLocaleString('en-IN')}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                ₹{Number(r.amountCharged).toLocaleString('en-IN')}
                              </td>
                              <td
                                style={{
                                  textAlign: 'right',
                                  fontWeight: 600,
                                  color: 'var(--success)',
                                }}
                              >
                                ₹{totalPaid.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button className="btn" onClick={() => setViewingProperty(null)}>
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>
              Failed to load property details.
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
