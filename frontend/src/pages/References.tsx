import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { referencesApi } from '@/api';
import useDebounce from '@/hooks/useDebounce';

interface ReferenceRecord {
  serviceType: string;
  applicationNo: string;
  customerName: string;
  status: string;
  applicationDate: string;
  contactName: string;
  contactPhone: string;
  contactAddress?: string;
  dateOfService: string;
}

interface GroupedReference {
  phone: string;
  name: string;
  address?: string;
  referredCount: number;
  records: ReferenceRecord[];
}

export default function ReferencesPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [selectedReference, setSelectedReference] = useState<GroupedReference | null>(null);
  const [modalPage, setModalPage] = useState(1);

  const limit = 10;

  // Query aggregated references
  const { data, isLoading } = useQuery({
    queryKey: ['references', debouncedSearch, page],
    queryFn: () =>
      referencesApi.getAll({ search: debouncedSearch, page, limit }).then((r) => r.data),
  });

  const references = (data?.data || []) as GroupedReference[];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const modalLimit = 5;
  const modalRecords = selectedReference?.records || [];
  const modalTotal = modalRecords.length;
  const modalTotalPages = Math.ceil(modalTotal / modalLimit);
  const paginatedModalRecords = modalRecords.slice(
    (modalPage - 1) * modalLimit,
    modalPage * modalLimit,
  );

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1); // Reset to first page when search changes
  };

  const handleViewHistory = (ref: GroupedReference) => {
    setSelectedReference(ref);
    setModalPage(1);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Customer References</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem' }}>
        <input
          placeholder="Search reference by name, phone number..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          style={{ flex: 1 }}
        />
        {search && (
          <button className="btn" onClick={() => handleSearchChange('')}>
            Clear
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ padding: '2rem', textAlign: 'center', fontWeight: 600 }}>
          Loading references...
        </div>
      ) : references.length === 0 ? (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            border: '3px solid var(--border)',
            borderRadius: 12,
            background: 'var(--surface)',
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700 }}>No References Found</div>
          <div style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>
            Try adjusting your search criteria or add more service applications.
          </div>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Primary Contact Name</th>
                <th>Mobile Number</th>
                <th>Address</th>
                <th style={{ textAlign: 'center' }}>Total Referrals</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {references.map((ref) => (
                <tr key={ref.phone} className="clickable-row">
                  <td style={{ fontWeight: 700 }}>{ref.name}</td>
                  <td>{ref.phone}</td>
                  <td>{ref.address || '—'}</td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        background: 'var(--accent-light)',
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: '1.5px solid var(--border)',
                      }}
                    >
                      {ref.referredCount}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-sm" onClick={() => handleViewHistory(ref)}>
                      View History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '1rem',
                marginTop: '1.25rem',
                marginBottom: '0.75rem',
              }}
            >
              <button
                className="btn btn-sm"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                style={{ minWidth: '80px' }}
              >
                Previous
              </button>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                Page {page} of {totalPages} ({total} references)
              </span>
              <button
                className="btn btn-sm"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                style={{ minWidth: '80px' }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* History Details Modal */}
      {selectedReference && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: 16,
          }}
          onClick={() => setSelectedReference(null)}
        >
          <div
            style={{
              background: 'var(--surface)',
              border: '3px solid var(--border)',
              borderRadius: 12,
              boxShadow: '8px 8px 0px var(--border)',
              width: '100%',
              maxWidth: 800,
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '1.5rem',
                borderBottom: '3px solid var(--border)',
                background: 'var(--accent)',
                color: '#000000',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Referred History</h3>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>
                  {selectedReference.name} | {selectedReference.phone}
                </div>
              </div>
              <button
                style={{
                  background: '#ffffff',
                  border: '2px solid var(--border)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 700,
                  padding: '4px 10px',
                  boxShadow: '2px 2px 0px var(--border)',
                }}
                onClick={() => setSelectedReference(null)}
              >
                Close
              </button>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              {selectedReference.address && (
                <div
                  style={{
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    border: '2px solid var(--border)',
                    borderRadius: 6,
                    background: 'var(--bg)',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <span style={{ color: 'var(--text-light)' }}>Contact Address: </span>
                  {selectedReference.address}
                </div>
              )}

              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Service Type</th>
                    <th>App/Token No.</th>
                    <th>Customer Name</th>
                    <th>Application Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedModalRecords.map((rec, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700 }}>{rec.serviceType}</td>
                      <td>{rec.applicationNo}</td>
                      <td>{rec.customerName}</td>
                      <td>{rec.applicationDate}</td>
                      <td>
                        <span
                          className={`badge badge-${
                            rec.status.toLowerCase() === 'approved' ? 'success' : 'warning'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {modalTotalPages > 1 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '1rem',
                    marginTop: '1.25rem',
                  }}
                >
                  <button
                    className="btn btn-sm"
                    onClick={() => setModalPage((p) => Math.max(p - 1, 1))}
                    disabled={modalPage === 1}
                    style={{ minWidth: '80px' }}
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                    Page {modalPage} of {modalTotalPages} ({modalTotal} records)
                  </span>
                  <button
                    className="btn btn-sm"
                    onClick={() => setModalPage((p) => Math.min(p + 1, modalTotalPages))}
                    disabled={modalPage === modalTotalPages}
                    style={{ minWidth: '80px' }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
