import { Customer } from '@/types';

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
  if (isLoading) {
    return <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading directory…</div>;
  }

  return (
    <div className="card" style={{ padding: 0 }}>
      <div className="table-wrapper">
        <table>
          <thead>
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
            {customers.map((c, i) => (
              <tr
                key={c.id}
                style={{
                  cursor: 'pointer',
                  background: selectedCustomerId === c.id ? 'var(--accent-light)' : 'transparent',
                }}
                onClick={() => setSelectedCustomerId(c.id)}
              >
                <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                <td style={{ fontWeight: 500 }}>{c.name}</td>
                <td>{c.phone}</td>
                <td className="hide-mobile" style={{ color: 'var(--text-muted)' }}>{c.email || '—'}</td>
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
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={isMobile ? 4 : 6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                  No customers found. Records saved in services will auto-create customers.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
