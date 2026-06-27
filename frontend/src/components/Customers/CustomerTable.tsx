import { Customer } from '@/types';
import useTableVirtualizer from '@/hooks/useTableVirtualizer';

interface CustomerTableProps {
  customers: Customer[];
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;
  isMobile: boolean;
  isLoading: boolean;
}

export default function CustomerTable({
  customers,
  selectedCustomerId,
  setSelectedCustomerId,
  isMobile,
  isLoading,
}: CustomerTableProps) {
  const { containerRef, startIndex, endIndex, topPadding, bottomPadding } = useTableVirtualizer({
    itemCount: customers.length,
    itemHeight: 52, // average height of one table row in pixels
    containerHeight: 450, // maximum height of viewport scroll container
    buffer: 3, // render 3 extra items offscreen for smoother scrolling
  });

  if (isLoading) {
    return <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading directory…</div>;
  }

  const visibleCustomers = customers.slice(startIndex, endIndex + 1);

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div
        ref={containerRef}
        className="table-wrapper"
        style={{ maxHeight: '450px', overflowY: 'auto', position: 'relative' }}
      >
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Mobile</th>
              <th className="hide-mobile">Email</th>
              <th className="hide-mobile">First Visit</th>
              <th style={{ width: 100 }}></th>
            </tr>
          </thead>
          <tbody>
            {topPadding > 0 && (
              <tr style={{ height: `${topPadding}px` }}>
                <td
                  colSpan={isMobile ? 4 : 6}
                  style={{ padding: 0, border: 'none', background: 'transparent' }}
                />
              </tr>
            )}

            {visibleCustomers.map((c, index) => {
              const originalIndex = startIndex + index;
              return (
                <tr
                  key={c.id}
                  style={{
                    cursor: 'pointer',
                    background: selectedCustomerId === c.id ? 'var(--accent-light)' : 'transparent',
                  }}
                  onClick={() => setSelectedCustomerId(c.id)}
                >
                  <td style={{ color: 'var(--text-muted)' }}>{originalIndex + 1}</td>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td>{c.phone}</td>
                  <td className="hide-mobile" style={{ color: 'var(--text-muted)' }}>
                    {c.email || '—'}
                  </td>
                  <td className="hide-mobile" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {new Date(c.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCustomerId(c.id);
                      }}
                    >
                      History
                    </button>
                  </td>
                </tr>
              );
            })}

            {bottomPadding > 0 && (
              <tr style={{ height: `${bottomPadding}px` }}>
                <td
                  colSpan={isMobile ? 4 : 6}
                  style={{ padding: 0, border: 'none', background: 'transparent' }}
                />
              </tr>
            )}

            {customers.length === 0 && (
              <tr>
                <td
                  colSpan={isMobile ? 4 : 6}
                  style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}
                />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
