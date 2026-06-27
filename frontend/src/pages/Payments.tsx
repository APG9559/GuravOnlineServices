import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marriagesApi, tradeLicensesApi } from '@/api';
import { MarriagePayment, TradeLicensePayment, PAYMENT_MODES, PAYMENT_ACCOUNTS } from '@/types';
import { useAuth } from '@/context/AuthContext';
import useDebounce from '@/hooks/useDebounce';
import NeoSelect from '@/components/NeoSelect';
import NeoDatePicker from '@/components/NeoDatePicker';

interface UnifiedPayment {
  id: string;
  source: 'marriage' | 'trade-license';
  amount: number;
  paymentMode: string;
  account: string;
  paymentDate: string;
  notes: string | null;
  createdBy: { name: string } | null;
  referenceText: string;
  badgeType: string;
  sourceBadge: string;
}

export default function PaymentsPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const [paymentMode, setPaymentMode] = useState('');
  const [account, setAccount] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Delete State
  const [deletingPayment, setDeletingPayment] = useState<UnifiedPayment | null>(null);

  // Build filter parameters
  const params: Record<string, string> = {};
  if (debouncedSearch) params.search = debouncedSearch;
  if (paymentMode) params.paymentMode = paymentMode;
  if (account) params.account = account;

  const { data: marriagePayments = [], isLoading: marriageLoading } = useQuery<MarriagePayment[]>({
    queryKey: ['marriagePayments', debouncedSearch, paymentMode, account],
    queryFn: () => marriagesApi.getAllPayments(params).then((res) => res.data),
  });

  const { data: tlPayments = [], isLoading: tlLoading } = useQuery<TradeLicensePayment[]>({
    queryKey: ['tradeLicensePayments', debouncedSearch, paymentMode, account],
    queryFn: () => tradeLicensesApi.getAllPayments(params).then((res) => res.data),
  });

  const isLoading = marriageLoading || tlLoading;

  const deleteMutation = useMutation({
    mutationFn: (payment: UnifiedPayment) => {
      if (payment.source === 'marriage') {
        return marriagesApi.deletePayment(payment.id);
      }
      return tradeLicensesApi.deletePayment(payment.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marriagePayments'] });
      queryClient.invalidateQueries({ queryKey: ['tradeLicensePayments'] });
      queryClient.invalidateQueries({ queryKey: ['marriage-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['marriages'] });
      queryClient.invalidateQueries({ queryKey: ['trade-records'] });
      setDeletingPayment(null);
    },
  });

  // Merge and sort payments
  const payments: UnifiedPayment[] = useMemo(() => {
    const marriageItems: UnifiedPayment[] = marriagePayments.map((p) => {
      const ticket = (p as any).ticket;
      const marriage = (p as any).marriage;
      let referenceText = '—';
      let badgeType = 'badge-secondary';

      if (ticket) {
        referenceText = `Ticket: ${ticket.ticketNumber} (${ticket.contactName})`;
        badgeType = 'badge-amber';
      } else if (marriage) {
        referenceText = `Record: Marriage (${marriage.contactName})`;
        badgeType = 'badge-green';
      }

      return {
        id: p.id,
        source: 'marriage' as const,
        amount: Number(p.amount),
        paymentMode: p.paymentMode,
        account: p.account,
        paymentDate: p.paymentDate,
        notes: p.notes || null,
        createdBy: p.createdBy,
        referenceText,
        badgeType,
        sourceBadge: 'Marriage',
      };
    });

    const tlItems: UnifiedPayment[] = tlPayments.map((p) => {
      const record = p.record;
      const businessName = record?.business?.name || 'Unknown';
      const tokenNo = record?.tokenNo;
      const referenceText = tokenNo
        ? `Token: ${tokenNo} (${businessName})`
        : `Business: ${businessName}`;

      return {
        id: p.id,
        source: 'trade-license' as const,
        amount: Number(p.amount),
        paymentMode: p.paymentMode,
        account: p.account,
        paymentDate: p.paymentDate,
        notes: p.notes || null,
        createdBy: p.createdBy,
        referenceText,
        badgeType: 'badge-blue',
        sourceBadge: 'Trade License',
      };
    });

    const merged = [...marriageItems, ...tlItems];

    // Apply module filter client-side
    const filtered = moduleFilter
      ? merged.filter((p) => p.source === moduleFilter)
      : merged;

    // Apply date range filter client-side
    const dateFiltered = filtered.filter((p) => {
      if (fromDate && p.paymentDate < fromDate) return false;
      if (toDate && p.paymentDate > toDate) return false;
      return true;
    });

    return dateFiltered.sort((a, b) =>
      new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    );
  }, [marriagePayments, tlPayments, moduleFilter, fromDate, toDate]);

  const handleClearFilters = () => {
    setSearch('');
    setPaymentMode('');
    setAccount('');
    setModuleFilter('');
    setFromDate('');
    setToDate('');
  };

  const modeOptions = [
    { value: '', label: 'All Modes' },
    ...PAYMENT_MODES.map((m) => ({ value: m, label: m })),
  ];

  const accountOptions = [
    { value: '', label: 'All Accounts' },
    ...PAYMENT_ACCOUNTS.map((a) => ({ value: a, label: a })),
  ];

  const moduleOptions = [
    { value: '', label: 'All Modules' },
    { value: 'marriage', label: 'Marriage' },
    { value: 'trade-license', label: 'Trade License' },
  ];

  // Calculate sum of currently filtered payments
  const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Payments Received Log</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Showing <strong>{payments.length}</strong> payment transactions
        </div>
      </div>

      {/* Top summary card */}
      <div 
        className="card" 
        style={{ 
          background: 'var(--accent-light)', 
          border: '3px solid var(--border)',
          boxShadow: '4px 4px 0px var(--border)',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text)', opacity: 0.8, display: 'block', marginBottom: '4px', letterSpacing: '0.5px' }}>
            Total Payments (Filtered)
          </span>
          <span style={{ fontSize: '32px', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>
            ₹{totalReceived.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        
        {(search || paymentMode || account || moduleFilter || fromDate || toDate) && (
          <button 
            className="btn" 
            onClick={handleClearFilters}
            style={{ 
              background: 'var(--surface)', 
              color: 'var(--text)', 
              border: '2px solid var(--border)',
              boxShadow: '2px 2px 0px var(--border)',
              fontWeight: 700,
              fontSize: '13px',
              padding: '8px 16px',
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Filter Row */}
      <div className="card" style={{ marginBottom: 20, padding: 15 }}>
        {/* Row 1: Primary Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 15, marginBottom: 15 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 'bold', display: 'block', marginBottom: 5 }}>Search Reference</label>
            <input
              type="text"
              placeholder="Search by ticket #, contact name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', height: '42px', border: '2px solid var(--border)', borderRadius: '4px', padding: '0 12px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 'bold', display: 'block', marginBottom: 5 }}>Payment Mode</label>
            <NeoSelect
              value={paymentMode}
              onChange={setPaymentMode}
              options={modeOptions}
              placeholder="All Modes"
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 'bold', display: 'block', marginBottom: 5 }}>Target Account</label>
            <NeoSelect
              value={account}
              onChange={setAccount}
              options={accountOptions}
              placeholder="All Accounts"
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 'bold', display: 'block', marginBottom: 5 }}>Module</label>
            <NeoSelect
              value={moduleFilter}
              onChange={setModuleFilter}
              options={moduleOptions}
              placeholder="All Modules"
            />
          </div>
        </div>

        {/* Row 2: Date Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 15 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 'bold', display: 'block', marginBottom: 5 }}>From Date</label>
            <NeoDatePicker value={fromDate} onChange={setFromDate} />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 'bold', display: 'block', marginBottom: 5 }}>To Date</label>
            <NeoDatePicker value={toDate} onChange={setToDate} />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          <div style={{ fontWeight: 600 }}>Loading payments log…</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Mode</th>
                  <th>Account</th>
                  <th>Module</th>
                  <th>Customer / Reference</th>
                  <th>Notes</th>
                  <th>Recorded By</th>
                  {isAdmin && <th style={{ textAlign: 'center', width: '80px' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 9 : 8} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                      No payments found matching the selected criteria.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={`${p.source}-${p.id}`}>
                      <td style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>
                        {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--accent)' }}>
                        ₹{p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span 
                          style={{ 
                            padding: '2px 8px', 
                            borderRadius: '4px', 
                            fontSize: '11px', 
                            fontWeight: 700,
                            background: 'var(--accent-light)',
                            border: '1.5px solid var(--border)',
                            display: 'inline-block'
                          }}
                        >
                          {p.paymentMode}
                        </span>
                      </td>
                      <td>
                        <span 
                          style={{ 
                            padding: '2px 8px', 
                            borderRadius: '4px', 
                            fontSize: '11px', 
                            fontWeight: 700,
                            background: 'var(--surface-subtle)',
                            border: '1.5px solid var(--border-light)',
                            display: 'inline-block'
                          }}
                        >
                          {p.account}
                        </span>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            fontSize: '10px',
                            background: p.source === 'marriage' ? 'var(--warning-bg)' : 'var(--neo-blue)',
                            color: '#000',
                          }}
                        >
                          {p.sourceBadge}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${p.badgeType}`} style={{ display: 'inline-block', fontSize: '12px' }}>
                          {p.referenceText}
                        </span>
                      </td>
                      <td style={{ fontStyle: 'italic', fontSize: '13px', color: 'var(--text-muted)' }}>
                        {p.notes || '—'}
                      </td>
                      <td>
                        <span style={{ fontWeight: 500 }}>{p.createdBy?.name || 'System'}</span>
                      </td>
                      {isAdmin && (
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => setDeletingPayment(p)}
                            className="btn btn-sm"
                            style={{ 
                              padding: '4px 8px', 
                              background: 'var(--danger-bg)', 
                              border: '1.5px solid var(--danger)',
                              color: 'var(--danger)',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '11px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Delete Payment"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPayment && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card modal-card" style={{ width: '100%', maxWidth: 400, position: 'relative', textAlign: 'center', padding: '2rem' }}>
            <button 
              onClick={() => setDeletingPayment(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              ✕
            </button>
            <div style={{ fontSize: 48, marginBottom: '1rem' }}>⚠️</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: '0.5rem' }}>Delete Payment Transaction?</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              This will remove this <strong>{deletingPayment.sourceBadge}</strong> payment record. The outstanding balance for the corresponding record will be updated. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => deleteMutation.mutate(deletingPayment)}
                disabled={deleteMutation.isPending}
                style={{ background: 'var(--danger)', color: '#fff', border: '2px solid var(--border)' }}
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Yes, Delete'}
              </button>
              <button className="btn" onClick={() => setDeletingPayment(null)} disabled={deleteMutation.isPending}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
