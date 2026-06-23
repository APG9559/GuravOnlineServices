interface UserPerformanceTableProps {
  userBreakdown?: {
    userId: string;
    userName: string;
    gross: number;
    net: number;
    expenses: number;
  }[];
}

export default function UserPerformanceTable({
  userBreakdown,
}: UserPerformanceTableProps) {
  return (
    <div className="card" style={{ marginTop: '1.5rem', padding: 0 }}>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '2px solid var(--border)' }}>
        <h3 style={{ fontWeight: 800, fontSize: 16, margin: 0, color: 'var(--text)' }}>Performance by Users</h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
          Breakdown of Gross Earnings, Expenses, and Net Earnings per operator
        </p>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Operator Name</th>
              <th style={{ textAlign: 'right' }}>Gross Earnings</th>
              <th style={{ textAlign: 'right' }}>Expenses</th>
              <th style={{ textAlign: 'right' }}>Net Earnings</th>
            </tr>
          </thead>
          <tbody>
            {userBreakdown?.map((u) => (
              <tr key={u.userId}>
                <td style={{ fontWeight: 700 }}>{u.userName}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                  ₹{u.gross.toLocaleString('en-IN')}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: 'rgb(220, 38, 38)' }}>
                  ₹{u.expenses.toLocaleString('en-IN')}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 900, color: 'var(--success)' }}>
                  ₹{u.net.toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
            {(!userBreakdown || userBreakdown.length === 0) && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  No user performance activity in this period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
