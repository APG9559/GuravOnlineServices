import React from 'react';

function fmtDate(dateStr?: string | null) {
  if (!dateStr) return '—';
  const matches = dateStr.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
  if (matches) {
    const [, year, month, day] = matches;
    return `${day}-${month}-${year}`;
  }
  return dateStr;
}

interface ActionBtnsProps {
  onPrint: () => void;
  onEdit: () => void;
  onDelete?: () => void;
  onView?: () => void;
}

function ActionBtns({ onPrint, onEdit, onDelete, onView }: ActionBtnsProps) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {onView && (
        <button
          className="btn btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          title="View breakdown/details"
          onClick={onView}
        >
          👁 View
        </button>
      )}
      <button className="btn btn-sm btn-success-soft" title="Print receipt" onClick={onPrint}>🖨</button>
      <button className="btn btn-sm" onClick={onEdit}>Edit</button>
      {onDelete && <button className="btn btn-sm btn-danger" onClick={onDelete}>Del</button>}
    </div>
  );
}

interface RecordsTableProps {
  isLoading: boolean;
  recordsList: any[];
  columns: { header: string; className?: string; style?: React.CSSProperties; render: (row: any, index: number) => React.ReactNode }[];
  currentPage: number;
  PAGE_SIZE: number;
  totalPages: number;
  totalCount: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  onPrint: (r: any) => void;
  onEdit: (r: any) => void;
  onDelete?: (id: string) => void;
  onView: (r: any) => void;
  isAdmin: boolean;
}

export default function RecordsTable({
  isLoading,
  recordsList,
  columns,
  currentPage,
  PAGE_SIZE,
  totalPages,
  totalCount,
  setCurrentPage,
  onPrint,
  onEdit,
  onDelete,
  onView,
  isAdmin,
}: RecordsTableProps) {
  const EmptyRow = () => (
    <tr>
      <td colSpan={20} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontSize: 14 }}>
        No records found.
      </td>
    </tr>
  );

  const LoadingRow = () => (
    <tr>
      <td colSpan={20} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
        Loading…
      </td>
    </tr>
  );

  return (
    <>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                {columns.map((col, idx) => (
                  <th key={idx} className={col.className} style={col.style}>
                    {col.header}
                  </th>
                ))}
                <th>Amount</th>
                <th>By</th>
                <th style={{ width: 120 }}></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <LoadingRow />
              ) : recordsList.length === 0 ? (
                <EmptyRow />
              ) : (
                recordsList.map((r: any, i: number) => (
                  <tr key={r.id}>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {i + 1 + (currentPage - 1) * PAGE_SIZE}
                    </td>
                    <td>{fmtDate(r.dateOfService)}</td>
                    {columns.map((col, idx) => (
                      <td key={idx} className={col.className} style={col.style}>
                        {col.render(r, i)}
                      </td>
                    ))}
                    <td style={{ fontWeight: 500 }}>
                      ₹{Number(r.amountCharged).toLocaleString('en-IN')}
                      {r.updatedAt && r.createdAt &&
                        new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime() > 5000 && (
                          <span
                            className="badge"
                            style={{
                              background: 'var(--surface)',
                              marginLeft: 6,
                              fontSize: 9,
                              verticalAlign: 'middle',
                            }}
                            title={`Last edited: ${new Date(r.updatedAt).toLocaleString('en-IN')}`}
                          >
                            edited
                          </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {r.createdBy?.name || '—'}
                    </td>
                    <td>
                      <ActionBtns
                        onPrint={() => onPrint(r)}
                        onEdit={() => onEdit(r)}
                        onDelete={
                          isAdmin && onDelete
                            ? () => {
                                if (confirm('Delete?')) onDelete(r.id);
                              }
                            : undefined
                        }
                        onView={() => onView(r)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {!isLoading && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.25rem', marginBottom: '0.75rem' }}>
          <button
            className="btn btn-sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{ minWidth: '80px' }}
          >
            Previous
          </button>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
            Page {currentPage} of {totalPages} ({totalCount} records)
          </span>
          <button
            className="btn btn-sm"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            style={{ minWidth: '80px' }}
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}
