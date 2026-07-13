import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { expensesApi } from '@/api';
import Modal from '@/components/Modal';
import NeoDatePicker from '@/components/NeoDatePicker';

interface UserPerformanceTableProps {
  userBreakdown?: {
    userId: string;
    userName: string;
    gross: number;
    net: number;
    expenses: number;
  }[];
  fromDate?: string;
  toDate?: string;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function UserPerformanceTable({
  userBreakdown,
  fromDate,
  toDate,
}: UserPerformanceTableProps) {
  const [selectedOperator, setSelectedOperator] = useState<{
    userId: string;
    userName: string;
  } | null>(null);
  const [localFromDate, setLocalFromDate] = useState<string>('');
  const [localToDate, setLocalToDate] = useState<string>('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Fetch operator expenses inside the table component (will only run when selectedOperator is not null)
  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['operator-expenses-detail', selectedOperator?.userId, localFromDate, localToDate],
    queryFn: () => {
      const params: Record<string, string> = {
        userId: selectedOperator!.userId,
      };
      if (localFromDate) params.from = localFromDate;
      if (localToDate) params.to = localToDate;
      return expensesApi.getAll(params).then((r) => r.data);
    },
    enabled: !!selectedOperator,
  });

  const totalSum = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

  return (
    <div className="card" style={{ marginTop: '1.5rem', padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '2px solid var(--border)' }}>
        <h3 style={{ fontWeight: 800, fontSize: 16, margin: 0, color: 'var(--text)' }}>
          Performance by Users
        </h3>
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
              <th style={{ textAlign: 'center', width: 140 }}>Actions</th>
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
                <td style={{ textAlign: 'center' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '4px 10px', fontSize: 12 }}
                    onClick={() => {
                      setSelectedOperator({ userId: u.userId, userName: u.userName });
                      setLocalFromDate(fromDate || '');
                      setLocalToDate(toDate || '');
                    }}
                  >
                    View Expenses
                  </button>
                </td>
              </tr>
            ))}
            {(!userBreakdown || userBreakdown.length === 0) && (
              <tr>
                <td
                  colSpan={5}
                  style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}
                >
                  No user performance activity in this period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedOperator && (
        <Modal
          title={`Expenses Added by ${selectedOperator.userName}`}
          onClose={() => setSelectedOperator(null)}
        >
          <div
            style={{
              minHeight: isCalendarOpen ? '420px' : 'auto',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-end',
                marginBottom: '1.25rem',
                flexWrap: 'wrap',
              }}
            >
              <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 130 }}>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: 4,
                  }}
                >
                  From Date
                </label>
                <NeoDatePicker
                  value={localFromDate}
                  onChange={(val) => setLocalFromDate(val)}
                  placeholder="From Date"
                  onCalendarToggle={setIsCalendarOpen}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 130 }}>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: 4,
                  }}
                >
                  To Date
                </label>
                <NeoDatePicker
                  value={localToDate}
                  onChange={(val) => setLocalToDate(val)}
                  placeholder="To Date"
                  onCalendarToggle={setIsCalendarOpen}
                />
              </div>
              <button
                className="btn btn-secondary btn-sm"
                style={{
                  height: 32,
                  padding: '0 12px',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                }}
                onClick={() => {
                  setLocalFromDate(fromDate || '');
                  setLocalToDate(toDate || '');
                }}
              >
                Reset to Dashboard
              </button>
            </div>

            <div style={{ marginBottom: '1.25rem', fontSize: 13, color: 'var(--text-muted)' }}>
              Showing expenses from{' '}
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                {localFromDate ? formatDate(localFromDate) : 'Start'}
              </span>{' '}
              to{' '}
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                {localToDate ? formatDate(localToDate) : 'End'}
              </span>
            </div>

            {expensesLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading expenses...
              </div>
            ) : (
              <div className="table-wrapper" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                <table style={{ margin: 0, width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((exp: { id: string; date: string; category: string; type: string; description?: string | null; amount: number }) => (
                      <tr key={exp.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatDate(exp.date)}</td>
                        <td>
                          <span
                            className={`badge ${exp.category === 'Shop' ? 'badge-blue' : 'badge-amber'}`}
                          >
                            {exp.category}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{exp.type}</td>
                        <td
                          style={{
                            color: 'var(--text-muted)',
                            fontSize: 13,
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={exp.description || ''}
                        >
                          {exp.description || (
                            <span style={{ fontStyle: 'italic', color: '#ccc' }}>—</span>
                          )}
                        </td>
                        <td
                          style={{ textAlign: 'right', fontWeight: 700, color: 'rgb(220, 38, 38)' }}
                        >
                          ₹{Number(exp.amount).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                    {expenses.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          style={{
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                            padding: '2rem',
                          }}
                        >
                          No expenses recorded in this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {expenses.length > 0 && (
                    <tfoot>
                      <tr
                        style={{
                          borderTop: '2px solid var(--border)',
                          background: 'var(--card-bg)',
                        }}
                      >
                        <td
                          colSpan={4}
                          style={{ fontWeight: 800, textAlign: 'right', padding: '12px 16px' }}
                        >
                          Total:
                        </td>
                        <td
                          style={{
                            fontWeight: 900,
                            textAlign: 'right',
                            color: 'rgb(220, 38, 38)',
                            padding: '12px 16px',
                          }}
                        >
                          ₹{totalSum.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
