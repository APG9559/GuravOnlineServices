import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { waterSuppliesApi } from '@/api';
import { WaterServiceRecord } from '@/types';
import { WATER_SERVICE_TYPE_LABELS } from '@/constants';
import WaterSupplyPaymentsModal from './WaterSupplyPaymentsModal';
import WaterSupplyDocumentsModal from './WaterSupplyDocumentsModal';
import { useAuth } from '@/context/AuthContext';

interface ServiceLogsTabProps {
  onPrint: (record: WaterServiceRecord) => void;
}

export default function ServiceLogsTab({ onPrint }: ServiceLogsTabProps) {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecordForPayments, setSelectedRecordForPayments] =
    useState<WaterServiceRecord | null>(null);
  const [selectedRecordForDocuments, setSelectedRecordForDocuments] =
    useState<WaterServiceRecord | null>(null);

  // Queries
  const { data: records = [], isLoading } = useQuery({
    queryKey: ['water-records', searchQuery],
    queryFn: () => waterSuppliesApi.getAll({ search: searchQuery }).then((r) => r.data),
    staleTime: 5000,
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id: string) => waterSuppliesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['water-records'] });
      qc.invalidateQueries({ queryKey: ['water-connections'] });
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this water service record log?')) {
      deleteMutation.mutate(id);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied token number to clipboard!');
  };

  if (isLoading && records.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading service logs...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Search Header */}
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
          placeholder="Search by owner, address, token, connection no..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          style={{ maxWidth: 350 }}
        />
      </div>

      {/* Logs Table */}
      <div
        className="table-responsive"
        style={{
          border: '3.5px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: '4px 4px 0 var(--border)',
          overflow: 'hidden',
        }}
      >
        <table className="table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th>Owner & Connection</th>
              <th>Service Details</th>
              <th>Date of Service</th>
              <th style={{ textAlign: 'right' }}>Official Fee</th>
              <th style={{ textAlign: 'right' }}>Service Fee</th>
              <th style={{ textAlign: 'right' }}>Total Cost</th>
              <th style={{ textAlign: 'right' }}>Paid</th>
              <th style={{ textAlign: 'right' }}>Balance</th>
              <th>Operator</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}
                >
                  No service logs found.
                </td>
              </tr>
            ) : (
              records.map((r: WaterServiceRecord) => {
                const connection = r.connection || {};
                const payments = r.payments || [];
                const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
                const totalCost = Number(r.amountCharged);
                const balance = totalCost - totalPaid;

                return (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{connection.currentOwner || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        Addr: {connection.connectionAddress}
                      </div>
                      {connection.connectionNo && (
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--primary)',
                            fontWeight: 600,
                            marginTop: 2,
                          }}
                        >
                          No: {connection.connectionNo}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-blue">
                        {WATER_SERVICE_TYPE_LABELS[r.serviceType] || r.serviceType}
                      </span>
                      {r.applicationTokenNo && (
                        <div
                          onClick={() => copyToClipboard(r.applicationTokenNo!)}
                          style={{
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            marginTop: 4,
                            display: 'inline-block',
                          }}
                          title="Click to copy token number"
                        >
                          Token:{' '}
                          <span style={{ textDecoration: 'underline' }}>
                            {r.applicationTokenNo}
                          </span>{' '}
                          📋
                        </div>
                      )}
                    </td>
                    <td>{r.dateOfService}</td>
                    <td style={{ textAlign: 'right' }}>
                      ₹{Number(r.officialFee).toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      ₹{Number(r.serviceFee).toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      ₹{totalCost.toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--success)' }}>
                      ₹{totalPaid.toLocaleString('en-IN')}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        color: balance > 0 ? 'var(--danger)' : 'var(--success)',
                      }}
                    >
                      ₹{balance.toLocaleString('en-IN')}
                    </td>
                    <td>{r.createdBy?.name || 'System'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          display: 'flex',
                          gap: 6,
                          justifyContent: 'flex-end',
                          alignItems: 'center',
                        }}
                      >
                        <button className="btn btn-sm" onClick={() => onPrint(r)}>
                          🖨 Print
                        </button>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => setSelectedRecordForPayments(r)}
                        >
                          Payments ({payments.length})
                        </button>
                        <button
                          className="btn btn-sm btn-accent"
                          onClick={() => setSelectedRecordForDocuments(r)}
                        >
                          Docs ({r.documents?.length || 0})
                        </button>
                        {isAdmin && (
                          <button
                            className="btn btn-sm"
                            style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}
                            disabled={deleteMutation.isPending}
                            onClick={() => handleDelete(r.id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Payments History Modal */}
      {selectedRecordForPayments && (
        <WaterSupplyPaymentsModal
          record={selectedRecordForPayments}
          onClose={() => setSelectedRecordForPayments(null)}
        />
      )}

      {/* Documents Modal */}
      {selectedRecordForDocuments && (
        <WaterSupplyDocumentsModal
          record={selectedRecordForDocuments}
          onClose={() => setSelectedRecordForDocuments(null)}
        />
      )}
    </div>
  );
}
