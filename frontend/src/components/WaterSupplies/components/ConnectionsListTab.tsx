import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { waterSuppliesApi } from '@/api';
import { WaterConnection, WaterServiceRecord } from '@/types';
import Modal from '@/components/Modal';
import { WATER_SERVICE_TYPE_LABELS } from '@/constants';
import { useAuth } from '@/context/AuthContext';

interface ConnectionsListTabProps {
  startServiceForConnection: (
    connection: WaterConnection,
    serviceType: WaterServiceRecord['serviceType'],
  ) => void;
}

// ─── Actions Dropdown ────────────────────────────────────────────────────────
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
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 4,
        left: Math.max(10, rect.right - 200),
      });
      setOpen(true);
    }
  };

  useEffect(() => {
    if (!open) return;
    const mountTime = Date.now();

    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      // Ignore scroll/resize events in the first 100ms to prevent layout-shift auto-closing
      if (Date.now() - mountTime > 100) {
        setOpen(false);
      }
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
// ─────────────────────────────────────────────────────────────────────────────

export default function ConnectionsListTab({ startServiceForConnection }: ConnectionsListTabProps) {
  const qc = useQueryClient();
  const { isAdmin, user } = useAuth();
  const hasApproveAccess = isAdmin || user?.role === 'operator';

  const [searchQuery, setSearchQuery] = useState('');
  const [approvingConnection, setApprovingConnection] = useState<WaterConnection | null>(null);
  const [connectionNo, setConnectionNo] = useState('');
  const [approveError, setApproveError] = useState('');
  const [viewingConnection, setViewingConnection] = useState<WaterConnection | null>(null);

  // Queries
  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['water-connections', searchQuery],
    queryFn: () => waterSuppliesApi.getAllConnections({ search: searchQuery }).then((r) => r.data),
    staleTime: 5000,
  });

  const { data: connectionDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['water-connection-details', viewingConnection?.id],
    queryFn: () => waterSuppliesApi.getConnectionDetails(viewingConnection!.id).then((r) => r.data),
    enabled: !!viewingConnection,
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: ({ id, connectionNo }: { id: string; connectionNo: string }) =>
      waterSuppliesApi.approveConnection(id, connectionNo).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['water-connections'] });
      qc.invalidateQueries({ queryKey: ['water-records'] });
      setApprovingConnection(null);
      setConnectionNo('');
      setApproveError('');
    },
    onError: (err: unknown) => {
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      setApproveError(errObj.response?.data?.message || errObj.message || 'Failed to approve connection');
    },
  });

  const handleApproveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApproveError('');
    if (!connectionNo.trim()) {
      setApproveError('Connection Number is required');
      return;
    }
    approveMutation.mutate({ id: approvingConnection!.id, connectionNo: connectionNo.trim() });
  };

  const statusBadgeClass = (status: WaterConnection['connectionStatus']) => {
    switch (status) {
      case 'Active':
        return 'badge-success';
      case 'Pending':
        return 'badge-warning';
      case 'Disconnected':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  if (isLoading && connections.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading connections...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Search */}
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
          placeholder="Search by owner, address, phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          style={{ maxWidth: 350 }}
        />
      </div>

      {/* Connection Profiles Table */}
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
                <th>Connection No</th>
                <th>Current Owner</th>
                <th>Address</th>
                <th>Contact Details</th>
                <th>Usage Type</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {connections.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}
                  >
                    No connection profiles found.
                  </td>
                </tr>
              ) : (
                connections.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700 }}>{c.connectionNo || 'PENDING'}</td>
                    <td>{c.currentOwner}</td>
                    <td>
                      <div
                        style={{
                          maxWidth: 200,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={c.connectionAddress}
                      >
                        {c.connectionAddress}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12 }}>
                        {c.contactPersonName && <div>{c.contactPersonName}</div>}
                        {c.contactPersonPhone && (
                          <div style={{ color: 'var(--text-muted)' }}>
                            📞 {c.contactPersonPhone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{c.currentUsage}</td>
                    <td>
                      <span className={`badge ${statusBadgeClass(c.connectionStatus)}`}>
                        {c.connectionStatus}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <ActionsDropdown
                        items={[
                          {
                            label: 'View Profile',
                            icon: '👤',
                            onClick: () => setViewingConnection(c),
                          },
                          ...(c.connectionStatus === 'Pending' && hasApproveAccess
                            ? [
                                {
                                  label: 'Approve Connection',
                                  icon: '✅',
                                  variant: 'primary' as const,
                                  dividerBefore: true,
                                  onClick: () => {
                                    setApprovingConnection(c);
                                    setConnectionNo('');
                                  },
                                },
                              ]
                            : []),
                          ...(c.connectionStatus === 'Active'
                            ? [
                                {
                                  label: 'Transfer Ownership',
                                  icon: '🔁',
                                  dividerBefore: true,
                                  onClick: () => startServiceForConnection(c, 'ConnectionTransfer'),
                                },
                                {
                                  label: 'Change Usage Type',
                                  icon: '🔄',
                                  onClick: () => startServiceForConnection(c, 'ChangeOfUse'),
                                },
                                {
                                  label: 'Disconnect Meter',
                                  icon: '🔌',
                                  onClick: () => startServiceForConnection(c, 'MeterDisconnection'),
                                  variant: 'danger' as const,
                                },
                                {
                                  label: 'Request Inspection',
                                  icon: '🔍',
                                  onClick: () => startServiceForConnection(c, 'MeterInspection'),
                                },
                                {
                                  label: 'No Dues Certificate',
                                  icon: '📄',
                                  onClick: () => startServiceForConnection(c, 'NoDuesCertificate'),
                                },
                              ]
                            : []),
                          ...(c.connectionStatus === 'Disconnected'
                            ? [
                                {
                                  label: 'Reconnect Meter',
                                  icon: '⚡',
                                  variant: 'success' as const,
                                  dividerBefore: true,
                                  onClick: () => startServiceForConnection(c, 'MeterReconnection'),
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
      {approvingConnection && (
        <Modal title="Approve Water Connection" onClose={() => setApprovingConnection(null)}>
          <form
            onSubmit={handleApproveSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 12 }}>
                Owner Name
              </span>
              <span style={{ fontWeight: 700 }}>{approvingConnection.currentOwner}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 12 }}>
                Address
              </span>
              <span style={{ fontWeight: 500 }}>{approvingConnection.connectionAddress}</span>
            </div>

            {approveError && <div className="alert-error">{approveError}</div>}

            <div className="form-group">
              <label>Assign Municipal Connection Number *</label>
              <input
                type="text"
                value={connectionNo}
                onChange={(e) => setConnectionNo(e.target.value)}
                placeholder="e.g. WMC/10292/A"
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
                {approveMutation.isPending ? 'Saving...' : 'Approve Connection'}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setApprovingConnection(null)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Viewing Connection Profile Details Modal */}
      {viewingConnection && (
        <Modal
          title={`Connection Profile — ${viewingConnection.connectionNo || 'PENDING'}`}
          onClose={() => setViewingConnection(null)}
        >
          {detailsLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>Loading profile details...</div>
          ) : connectionDetails ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Profile Details Grid */}
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
                    Owner Name
                  </span>
                  <span style={{ fontWeight: 700 }}>{connectionDetails.currentOwner}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 12 }}>
                    Connection Number
                  </span>
                  <span style={{ fontWeight: 700 }}>
                    {connectionDetails.connectionNo || 'PENDING APPROVAL'}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 12 }}>
                    Address
                  </span>
                  <span>{connectionDetails.connectionAddress}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 12 }}>
                    Usage Category
                  </span>
                  <span>{connectionDetails.currentUsage}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 12 }}>
                    Status
                  </span>
                  <span className={`badge ${statusBadgeClass(connectionDetails.connectionStatus)}`}>
                    {connectionDetails.connectionStatus}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 12 }}>
                    Registered Date
                  </span>
                  <span>
                    {new Date(connectionDetails.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Service Transaction History */}
              <div>
                <h4
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    marginBottom: 12,
                    textTransform: 'uppercase',
                  }}
                >
                  Service Transaction Logs
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
                        <th>Token Number</th>
                        <th>Date of Service</th>
                        <th style={{ textAlign: 'right' }}>Official Fee</th>
                        <th style={{ textAlign: 'right' }}>Service Fee</th>
                        <th style={{ textAlign: 'right' }}>Total Charged</th>
                        <th style={{ textAlign: 'right' }}>Total Paid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(connectionDetails.records || []).length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            style={{
                              textAlign: 'center',
                              padding: '1.5rem',
                              color: 'var(--text-muted)',
                            }}
                          >
                            No service history recorded.
                          </td>
                        </tr>
                      ) : (
                        (connectionDetails.records || []).map((r) => {
                          const totalPaid = (r.payments || []).reduce(
                            (sum: number, p) => sum + Number(p.amount),
                            0,
                          );
                          return (
                            <tr key={r.id}>
                              <td style={{ fontWeight: 600 }}>
                                {WATER_SERVICE_TYPE_LABELS[r.serviceType] || r.serviceType}
                              </td>
                              <td>{r.applicationTokenNo || '—'}</td>
                              <td>{r.dateOfService}</td>
                              <td style={{ textAlign: 'right' }}>
                                ₹{Number(r.officialFee).toLocaleString('en-IN')}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                ₹{Number(r.serviceFee).toLocaleString('en-IN')}
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
                <button className="btn" onClick={() => setViewingConnection(null)}>
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>
              Failed to load profile details.
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
