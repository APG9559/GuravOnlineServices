import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tradeLicensesApi } from '@/api';
import { TradeLicenseRecord, SERVICE_TYPE_LABELS } from '@/types';

interface ServiceLogsTabProps {
  onPrint: (record: TradeLicenseRecord) => void;
}

export default function ServiceLogsTab({ onPrint }: ServiceLogsTabProps) {
  const qc = useQueryClient();
  const [logsSearch, setLogsSearch] = useState('');
  const [licenseNoToApprove, setLicenseNoToApprove] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/public/receipt/trade-license/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Queries
  const { data: records = [], isLoading: recordsLoading } = useQuery({
    queryKey: ['trade-records', logsSearch],
    queryFn: () => tradeLicensesApi.getAll({ search: logsSearch }).then((r) => r.data),
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: ({ id, licenseNo }: { id: string; licenseNo: string }) =>
      tradeLicensesApi.approveApplication(id, licenseNo).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trade-records'] });
      qc.invalidateQueries({ queryKey: ['trade-businesses-all'] });
      qc.invalidateQueries({ queryKey: ['trade-renewal-queue'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return (
    <div className="card" style={{ padding: 0 }}>
      <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
        <input
          className="search-input"
          style={{ width: '100%', margin: 0 }}
          placeholder="Search by business name, license, token, phone..."
          value={logsSearch}
          onChange={(e) => setLogsSearch(e.target.value)}
        />
      </div>

      {recordsLoading ? (
        <div style={{ padding: 20 }}>Loading...</div>
      ) : records.length === 0 ? (
        <div style={{ padding: 20, color: 'var(--text-muted)' }}>No transaction logs matching criteria.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Service Type</th>
              <th>Business Name</th>
              <th>Token No</th>
              <th>Amt Charged</th>
              <th>By</th>
              <th>Approval Action</th>
              <th style={{ width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td>{r.dateOfService}</td>
                <td>
                  <span className="badge badge-blue">
                    {SERVICE_TYPE_LABELS[r.serviceType] || r.serviceType}
                  </span>
                </td>
                <td style={{ fontWeight: 500 }}>{r.business?.name || '—'}</td>
                <td>{r.tokenNo || '—'}</td>
                <td style={{ fontWeight: 500 }}>₹{Number(r.amountCharged).toLocaleString('en-IN')}</td>
                <td>{r.createdBy?.name || 'System'}</td>
                <td>
                  {r.serviceType === 'New' && r.business?.status === 'Pending' ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        style={{ margin: 0, padding: '4px 8px', fontSize: 12, height: 28 }}
                        placeholder="Assign License No"
                        value={licenseNoToApprove[r.id] ?? ''}
                        onChange={(e) =>
                          setLicenseNoToApprove({
                            ...licenseNoToApprove,
                            [r.id]: e.target.value,
                          })
                        }
                      />
                      <button
                        className="btn btn-sm btn-primary"
                        style={{ height: 28, padding: '0 8px' }}
                        disabled={approveMutation.isPending || !licenseNoToApprove[r.id]}
                        onClick={() =>
                          approveMutation.mutate({
                            id: r.id,
                            licenseNo: licenseNoToApprove[r.id],
                          })
                        }
                      >
                        Approve
                      </button>
                    </div>
                  ) : r.serviceType === 'New' ? (
                    <span className="badge badge-green">License No: {r.business?.licenseNo}</span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>N/A</span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn btn-sm"
                      title="Share Receipt"
                      onClick={() => handleCopyLink(r.id)}
                      style={{ padding: '3px 8px', minWidth: 26, justifyContent: 'center' }}
                    >
                      {copiedId === r.id ? '✓' : '🔗'}
                    </button>
                    <button
                      className="btn btn-sm"
                      title="Print Receipt"
                      onClick={() => onPrint(r)}
                      style={{ padding: '3px 8px', minWidth: 26, justifyContent: 'center' }}
                    >
                      🖨
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
