import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TradeLicenseRecord } from '@/types';
import { PAYMENT_MODES, SERVICE_TYPE_LABELS } from '@/constants';
import { usePaymentAccounts } from '@/hooks/usePaymentAccounts';
import { tradeLicensesApi } from '@/api';
import { useAuth } from '@/context/AuthContext';
import NeoSelect from '@/components/NeoSelect';
import NeoDatePicker from '@/components/NeoDatePicker';
import UpiQrCode from '@/components/UpiQrCode';

interface TradeLicensePaymentsModalProps {
  record: TradeLicenseRecord;
  onClose: () => void;
}

export default function TradeLicensePaymentsModal({
  record: initialRecord,
  onClose,
}: TradeLicensePaymentsModalProps) {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();

  // Freshly fetch the record with its payments relations
  const { data: record = initialRecord } = useQuery({
    queryKey: ['trade-record', initialRecord.id],
    queryFn: () => tradeLicensesApi.getOne(initialRecord.id).then((r) => r.data),
    initialData: initialRecord,
    staleTime: 5000,
  });

  // State for adding a payment
  const [showAddForm, setShowAddForm] = useState(false);
  const [amount, setAmount] = useState('');
  const {
    paymentMode,
    setPaymentMode,
    selectedAccount,
    setSelectedAccount,
    customAccount,
    setCustomAccount,
    isOtherSelected,
    accountOptions,
    resolvedAccount,
    reset: resetAccounts,
  } = usePaymentAccounts();
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [upiId, setUpiId] = useState('');
  const [payeeName, setPayeeName] = useState('');

  useEffect(() => {
    if (paymentMode === 'UPI') {
      const lower = (selectedAccount || '').toLowerCase();
      if (lower.includes('vaishali')) {
        setUpiId(import.meta.env.VITE_UPI_ID_VAISHALI || '9890692659@upi');
        setPayeeName('Vaishali Gurav');
      } else if (lower.includes('ashish')) {
        setUpiId(import.meta.env.VITE_UPI_ID_ASHISH || '9112019559@upi');
        setPayeeName('Ashish Gurav');
      } else if (lower.includes('parshuram')) {
        setUpiId(import.meta.env.VITE_UPI_ID_PARSHURAM || '9372725588@upi');
        setPayeeName('Parshuram Gurav');
      } else if (lower.includes('gauri')) {
        setUpiId(import.meta.env.VITE_UPI_ID_GAURI || '7066115942@barodampay');
        setPayeeName('Gauri Gurav');
      } else if (selectedAccount === 'Other') {
        setPayeeName(customAccount || 'Gurav Online Services');
      }
    } else {
      setUpiId('');
      setPayeeName('');
    }
  }, [paymentMode, selectedAccount, customAccount]);

  // Mutations
  const addPaymentMut = useMutation({
    mutationFn: (data: unknown) => tradeLicensesApi.addPayment(record.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trade-record', record.id] });
      qc.invalidateQueries({ queryKey: ['trade-records'] });
      qc.invalidateQueries({ queryKey: ['tradeLicensePayments'] });
      setAmount('');
      resetAccounts();
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setError('');
      setShowAddForm(false);
    },
  });

  const deletePaymentMut = useMutation({
    mutationFn: (id: string) => tradeLicensesApi.deletePayment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trade-record', record.id] });
      qc.invalidateQueries({ queryKey: ['trade-records'] });
      qc.invalidateQueries({ queryKey: ['tradeLicensePayments'] });
    },
  });

  // Computations
  const payments = record.payments || [];
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const amountCharged = Number(record.amountCharged);
  const balance = amountCharged - totalPaid;

  const handleAddPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amtVal = parseFloat(amount);
    if (isNaN(amtVal) || amtVal <= 0) {
      setError('Please enter a valid payment amount greater than zero.');
      return;
    }
    if (!paymentMode) {
      setError('Please select a payment mode.');
      return;
    }
    if (!selectedAccount) {
      setError('Please select a target account.');
      return;
    }
    if (isOtherSelected && !customAccount.trim()) {
      setError('Please specify the other account name.');
      return;
    }
    if (!paymentDate) {
      setError('Please select a payment date.');
      return;
    }

    addPaymentMut.mutate({
      amount: amtVal,
      paymentMode,
      account: resolvedAccount,
      paymentDate,
      notes: notes.trim() || undefined,
    });
  };

  const handleDeletePayment = (paymentId: string) => {
    if (window.confirm('Are you sure you want to delete this payment? This action is permanent.')) {
      deletePaymentMut.mutate(paymentId);
    }
  };

  const modeOptions = PAYMENT_MODES.map((m) => ({ value: m, label: m }));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        className="card modal-card"
        style={{
          width: '100%',
          maxWidth: 540,
          position: 'relative',
          padding: '1.5rem 2rem',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: 18,
            cursor: 'pointer',
            color: 'var(--text-muted)',
          }}
        >
          ✕
        </button>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center' }}>
          Payments — {record.business?.name || 'Trade License'}
        </h3>

        {/* Record Info Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px 16px',
            marginBottom: '1.5rem',
            fontSize: '13px',
          }}
        >
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Service Type</span>
            <span className="badge badge-blue">
              {SERVICE_TYPE_LABELS[record.serviceType] || record.serviceType}
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Token No</span>
            <span style={{ fontWeight: 500 }}>{record.tokenNo || '—'}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Date of Service</span>
            <span style={{ fontWeight: 500 }}>{record.dateOfService}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Business</span>
            <span style={{ fontWeight: 500 }}>{record.business?.name || '—'}</span>
          </div>
        </div>

        {/* Financial Summary */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 8,
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              textAlign: 'center',
              padding: '12px 8px',
              background: 'var(--accent-light)',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius)',
              boxShadow: '2px 2px 0px var(--border)',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                marginBottom: 4,
                textTransform: 'uppercase',
              }}
            >
              Total Cost
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800 }}>
              ₹{amountCharged.toLocaleString('en-IN')}
            </div>
          </div>
          <div
            style={{
              textAlign: 'center',
              padding: '12px 8px',
              background: 'var(--success-bg)',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius)',
              boxShadow: '2px 2px 0px var(--border)',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                marginBottom: 4,
                textTransform: 'uppercase',
              }}
            >
              Paid
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800 }}>
              ₹{totalPaid.toLocaleString('en-IN')}
            </div>
          </div>
          <div
            style={{
              textAlign: 'center',
              padding: '12px 8px',
              background: balance > 0 ? 'var(--danger-bg)' : 'var(--success-bg)',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius)',
              boxShadow: '2px 2px 0px var(--border)',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                marginBottom: 4,
                textTransform: 'uppercase',
              }}
            >
              Balance
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800 }}>
              ₹{balance.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Payments History */}
        <div style={{ marginBottom: '1rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase' }}>
              Payment History
            </span>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => setShowAddForm(!showAddForm)}
              style={{ fontSize: 12 }}
            >
              {showAddForm ? 'Cancel' : '+ Add Payment'}
            </button>
          </div>

          {payments.length === 0 && !showAddForm ? (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 13,
                border: '2px dashed var(--border-light)',
                borderRadius: 'var(--radius)',
              }}
            >
              No payments recorded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {payments.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    border: '2px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    background: 'var(--bg)',
                    boxShadow: '2px 2px 0px var(--border)',
                    gap: 8,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
                    >
                      <span style={{ fontWeight: 700, fontSize: 15 }}>
                        ₹{Number(p.amount).toLocaleString('en-IN')}
                      </span>
                      <span className="badge badge-blue" style={{ fontSize: 10 }}>
                        {p.paymentMode}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        → {p.account}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {p.notes && <span> • {p.notes}</span>}
                      <span> • by {p.createdBy?.name || 'System'}</span>
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleDeletePayment(p.id)}
                      className="btn btn-sm"
                      disabled={deletePaymentMut.isPending}
                      style={{
                        padding: '3px 8px',
                        background: 'var(--danger-bg)',
                        border: '1.5px solid var(--border)',
                        color: 'var(--danger)',
                        fontSize: 11,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                      title="Delete Payment"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Payment Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddPaymentSubmit}
            style={{
              border: '2.5px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '16px',
              background: 'var(--surface)',
              boxShadow: '3px 3px 0px var(--border)',
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                marginBottom: 12,
                textTransform: 'uppercase',
              }}
            >
              Record Payment
            </div>

            {error && (
              <div className="alert-error" style={{ marginBottom: 12, fontSize: 13 }}>
                {error}
              </div>
            )}

            <div className="grid-2" style={{ marginBottom: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Amount (₹) <span className="required-star">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Max: ₹${balance.toLocaleString('en-IN')}`}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Payment Date <span className="required-star">*</span></label>
                <NeoDatePicker value={paymentDate} onChange={setPaymentDate} />
              </div>
            </div>

            <div className="grid-2" style={{ marginBottom: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Payment Mode <span className="required-star">*</span></label>
                <NeoSelect
                  value={paymentMode}
                  onChange={setPaymentMode}
                  options={modeOptions}
                  placeholder="Select Mode"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Target Account <span className="required-star">*</span></label>
                <NeoSelect
                  value={selectedAccount}
                  onChange={setSelectedAccount}
                  options={accountOptions}
                  placeholder={paymentMode ? 'Select Account' : 'Select Mode First'}
                  disabled={!paymentMode}
                />
              </div>
            </div>

            {isOtherSelected && (
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label>Specify Account <span className="required-star">*</span></label>
                <input
                  type="text"
                  value={customAccount}
                  onChange={(e) => setCustomAccount(e.target.value)}
                  placeholder="e.g. Vaishali Gurav GPay"
                  required
                />
              </div>
            )}

            {paymentMode === 'UPI' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginBottom: '12px',
                }}
              >
                {selectedAccount === 'Other' && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Payee Name <span className="required-star">*</span></label>
                    <input
                      type="text"
                      value={payeeName}
                      onChange={(e) => setPayeeName(e.target.value)}
                      placeholder="e.g. Gurav Online Services"
                      required
                    />
                  </div>
                )}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Payee UPI ID <span className="required-star">*</span></label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. merchant@okaxis"
                    required
                  />
                </div>

                <UpiQrCode
                  upiId={upiId}
                  payeeName={payeeName}
                  amount={parseFloat(amount) || 0}
                  transactionRef={`${record.tokenNo || record.id}-${Date.now()}`}
                  transactionNote={`Payment for Trade License ${record.tokenNo || record.id}`}
                />
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Notes (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Partial payment..."
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={addPaymentMut.isPending}
              style={{ width: '100%' }}
            >
              {addPaymentMut.isPending ? 'Saving…' : 'Record Payment'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
