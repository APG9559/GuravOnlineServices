import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { activityLogsApi } from '@/api';
import { ActivityLog } from '@/types';

export default function AuditLogsPage() {
  const [page, setPage] = useState(0);
  const [limit] = useState(50);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  const [filterAction, setFilterAction] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [searchOperator, setSearchOperator] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['activityLogs', page, limit],
    queryFn: () => activityLogsApi.getAll({ limit, offset: page * limit }).then((r) => r.data),
  });

  const logs = data?.data || [];
  const total = data?.total || 0;
  const pageCount = Math.ceil(total / limit);

  // Apply client-side filters since pagination returns raw lists
  const filteredLogs = logs.filter((log) => {
    const actionMatches = !filterAction || log.action === filterAction;
    const moduleMatches = !filterModule || log.module?.toLowerCase().includes(filterModule.toLowerCase());
    const operatorMatches = !searchOperator || 
      log.user?.name?.toLowerCase().includes(searchOperator.toLowerCase()) || 
      log.user?.email?.toLowerCase().includes(searchOperator.toLowerCase());
    return actionMatches && moduleMatches && operatorMatches;
  });

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return { bg: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' };
      case 'UPDATE':
        return { bg: '#fff3cd', color: '#856404', border: '1px solid #ffeeba' };
      case 'DELETE':
        return { bg: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' };
      default:
        return { bg: '#e2e3e5', color: '#383d41', border: '1px solid #d6d8db' };
    }
  };

  const formatModuleName = (mod: string) => {
    if (!mod) return '—';
    return mod
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Operator Audit Logs</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Total logged events: <strong>{total}</strong>
        </div>
      </div>

      {/* Filters Card */}
      <div className="card" style={{ marginBottom: 20, padding: 15 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 15 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 'bold', display: 'block', marginBottom: 5 }}>Operator Search</label>
            <input
              type="text"
              className="input-field"
              placeholder="Search by name/email..."
              value={searchOperator}
              onChange={(e) => setSearchOperator(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 'bold', display: 'block', marginBottom: 5 }}>Action Type</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="input-field"
              style={{ width: '100%', height: 42 }}
            >
              <option value="">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 'bold', display: 'block', marginBottom: 5 }}>Module Filter</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. affidavits, marriages..."
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading logs…</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Operator</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Record ID</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
                      No activity logs found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const badge = getActionBadgeColor(log.action);
                    return (
                      <tr key={log.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {new Date(log.createdAt).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{log.user?.name || 'System / Deleted User'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{log.user?.email || '—'}</div>
                        </td>
                        <td>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 'bold',
                              display: 'inline-block',
                              ...badge,
                            }}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 500 }}>
                            {formatModuleName(log.module)}
                          </span>
                        </td>
                        <td>
                          <code style={{ fontSize: 11, background: '#f5f5f5', padding: '2px 4px', borderRadius: 2 }}>
                            {log.recordId || '—'}
                          </code>
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedLog(log)}
                            style={{ padding: '4px 8px', fontSize: 11 }}
                          >
                            Inspect JSON
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pageCount > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderTop: '2px solid #000' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Page <strong>{page + 1}</strong> of <strong>{pageCount}</strong>
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn btn-secondary"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  style={{ padding: '6px 12px', fontSize: 13 }}
                >
                  Previous
                </button>
                <button
                  className="btn btn-secondary"
                  disabled={page >= pageCount - 1}
                  onClick={() => setPage((p) => p + 1)}
                  style={{ padding: '6px 12px', fontSize: 13 }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inspect Log Details Modal */}
      {selectedLog && (
        <div className="modal-backdrop" onClick={() => setSelectedLog(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <h3>Inspect Log Entry</h3>
              <button className="close-btn" onClick={() => setSelectedLog(null)}>&times;</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15, fontSize: 13 }}>
              <div>
                <strong>Operator:</strong> {selectedLog.user?.name || 'System / Deleted User'} ({selectedLog.user?.email || '—'})
              </div>
              <div>
                <strong>Action:</strong> {selectedLog.action}
              </div>
              <div>
                <strong>Module:</strong> {formatModuleName(selectedLog.module)}
              </div>
              <div>
                <strong>Record ID:</strong> <code>{selectedLog.recordId || '—'}</code>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <strong>Timestamp:</strong> {new Date(selectedLog.createdAt).toString()}
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <strong style={{ display: 'block', marginBottom: 5 }}>Request Details (JSON):</strong>
              <pre
                style={{
                  background: '#1e1e1e',
                  color: '#4fc1ff',
                  padding: 15,
                  borderRadius: 4,
                  fontSize: 12,
                  overflowX: 'auto',
                  border: '2px solid #000',
                  boxShadow: '4px 4px 0px #000',
                  maxHeight: 300,
                }}
              >
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>

            <div className="modal-footer" style={{ marginTop: 20 }}>
              <button className="btn btn-primary" onClick={() => setSelectedLog(null)}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
