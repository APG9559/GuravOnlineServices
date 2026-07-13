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
      <button className="btn btn-sm btn-success-soft" title="Print receipt" onClick={onPrint}>
        🖨
      </button>
      <button className="btn btn-sm" onClick={onEdit}>
        Edit
      </button>
      {onDelete && (
        <button className="btn btn-sm btn-danger" onClick={onDelete}>
          Del
        </button>
      )}
    </div>
  );
}

interface Column<T> {
  header: string;
  className?: string;
  style?: React.CSSProperties;
  render: (row: T, index: number) => React.ReactNode;
}

interface RecordsTableProps<T> {
  isLoading: boolean;
  recordsList: T[];
  columns: Column<T>[];
  currentPage: number;
  PAGE_SIZE: number;
  totalPages: number;
  totalCount: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  onPrint: (r: T) => void;
  onEdit: (r: T) => void;
  onDelete?: (id: string) => void;
  onView: (r: T) => void;
  isAdmin: boolean;
}

export default function RecordsTable<
  T extends {
    id: string;
    dateOfService?: string | null;
    amountCharged?: number | null;
    updatedAt?: string | null;
    createdAt?: string | null;
    createdBy?: { name?: string } | null;
  }
>({
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
}: RecordsTableProps<T>) {
  const EmptyRow = () => (
    <tr>
      <td
        colSpan={20}
        style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontSize: 14 }}
      >
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

  const rows = isLoading ? (
    <LoadingRow />
  ) : recordsList.length === 0 ? (
    <EmptyRow />
  ) : (
    recordsList.map((r, i) => {
      const id = r.id;
      const dateOfService = r.dateOfService;
      const amountCharged = r.amountCharged;
      const updatedAt = r.updatedAt;
      const createdAt = r.createdAt;
      const createdBy = r.createdBy;
      return (
        <tr key={id}>
          <td style={{ color: 'var(--text-muted)' }}>
            {i + 1 + (currentPage - 1) * PAGE_SIZE}
          </td>
          <td>{fmtDate(dateOfService)}</td>
          {columns.map((col, idx) => (
            <td key={idx} className={col.className} style={col.style}>
              {col.render(r, i)}
            </td>
          ))}
          <td style={{ fontWeight: 500 }}>
            ₹{Number(amountCharged).toLocaleString('en-IN')}
            {updatedAt &&
              createdAt &&
              new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 5000 && (
                <span
                  className="badge"
                  style={{
                    background: 'var(--surface)',
                    marginLeft: 6,
                    fontSize: 9,
                    verticalAlign: 'middle',
                  }}
                  title={`Last edited: ${new Date(updatedAt).toLocaleString('en-IN')}`}
                >
                  edited
                </span>
              )}
          </td>
          <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            {createdBy?.name || '—'}
          </td>
          <td>
            <ActionBtns
              onPrint={() => onPrint(r)}
              onEdit={() => onEdit(r)}
              onDelete={
                isAdmin && onDelete
                  ? () => {
                      if (confirm('Delete?')) onDelete(id);
                    }
                  : undefined
              }
              onView={() => onView(r)}
            />
          </td>
        </tr>
      );
    })
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
            <tbody>{rows}</tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {!isLoading && totalPages > 1 && (
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
