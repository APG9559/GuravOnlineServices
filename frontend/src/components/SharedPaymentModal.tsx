import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PAYMENT_MODES } from '@/constants';
import { usePaymentAccounts } from '@/hooks/usePaymentAccounts';
import { useAuth } from '@/context/AuthContext';
import NeoSelect from '@/components/NeoSelect';
import NeoDatePicker from '@/components/NeoDatePicker';
import UpiQrCode from '@/components/UpiQrCode';
import styles from './SharedPaymentModal.module.css';

interface PaymentInfo {
  id: string;
  amount: number;
  paymentMode: string;
  account: string;
  paymentDate: string;
  notes?: string | null;
  createdBy?: { name?: string };
}

interface SharedPaymentModalProps {
  recordId: string;
  title: string;
  subtitle?: string;
  amountCharged: number;
  payments: PaymentInfo[];
  api: {
    getOne: (id: string) => Promise<{ data: unknown }>;
    addPayment: (recordId: string, data: unknown) => Promise<unknown>;
    deletePayment: (id: string) => Promise<unknown>;
  };
  queryKeys: string[];
  infoFields?: { label: string; value: string | React.ReactNode }[];
  serviceTypeLabel?: string;
  tokenNo?: string;
  dateOfService?: string;
  onClose: () => void;
}

export default function SharedPaymentModal({
  recordId,
  title,
  subtitle,
  amountCharged,
  payments: initialPayments,
  api,
  queryKeys,
  infoFields,
  onClose,
}: SharedPaymentModalProps) {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();

  const { data: freshRecord } = useQuery({
    queryKey: [queryKeys[0], recordId],
    queryFn: () => api.getOne(recordId).then((r) => r.data) as Promise<{ payments?: PaymentInfo[] }>,
    staleTime: 5000,
  });

  const payments = freshRecord?.payments || initialPayments;
  const totalPaid = payments.reduce((sum: number, p: PaymentInfo) => sum + Number(p.amount), 0);
  const balance = amountCharged - totalPaid;

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

  const addPaymentMut = useMutation({
    mutationFn: (data: unknown) => api.addPayment(recordId, data),
    onSuccess: () => {
      queryKeys.forEach((key) => qc.invalidateQueries({ queryKey: [key] }));
      setAmount('');
      resetAccounts();
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setError('');
      setShowAddForm(false);
    },
  });

  const deletePaymentMut = useMutation({
    mutationFn: (id: string) => api.deletePayment(id),
    onSuccess: () => {
      queryKeys.forEach((key) => qc.invalidateQueries({ queryKey: [key] }));
    },
  });

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

  const modeOptions = PAYMENT_MODES.map((m: string) => ({ value: m, label: m }));

  return (
    <div className={styles.overlay}>
      <div className={`card ${styles.card}`}>
        <button onClick={onClose} className={styles.closeBtn}>
          ✕
        </button>
        <h3 className={styles.title}>Payments — {subtitle || title}</h3>

        {/* Record Info Grid */}
        {infoFields && (
          <div className={styles.infoGrid}>
            {infoFields.map((f, i) => (
              <div key={i}>
                <span className={styles.infoLabel}>{f.label}</span>
                <span className={styles.infoValue}>{f.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Financial Summary */}
        <div className={styles.summaryGrid}>
          <div className={`${styles.summaryCard} ${styles.summaryCardAccent}`}>
            <div className={styles.summaryLabel}>Total Cost</div>
            <div className={styles.summaryValue}>₹{amountCharged.toLocaleString('en-IN')}</div>
          </div>
          <div className={`${styles.summaryCard} ${styles.summaryCardSuccess}`}>
            <div className={styles.summaryLabel}>Paid</div>
            <div className={styles.summaryValue}>₹{totalPaid.toLocaleString('en-IN')}</div>
          </div>
          <div
            className={styles.summaryCard}
            style={{ background: balance > 0 ? 'var(--danger-bg)' : 'var(--success-bg)' }}
          >
            <div className={styles.summaryLabel}>Balance</div>
            <div className={styles.summaryValue}>₹{balance.toLocaleString('en-IN')}</div>
          </div>
        </div>

        {/* Payments History */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Payment History</span>
            <button
              className={`btn btn-sm btn-primary ${styles.btnAddPayment}`}
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? 'Cancel' : '+ Add Payment'}
            </button>
          </div>

          {payments.length === 0 && !showAddForm ? (
            <div className={styles.emptyState}>No payments recorded yet.</div>
          ) : (
            <div className={styles.paymentsList}>
              {payments.map((p: PaymentInfo) => (
                <div key={p.id} className={styles.paymentItem}>
                  <div className={styles.paymentInfo}>
                    <div className={styles.paymentRow}>
                      <span className={styles.paymentAmount}>
                        ₹{Number(p.amount).toLocaleString('en-IN')}
                      </span>
                      <span className={`badge badge-blue ${styles.badgeSmall}`}>
                        {p.paymentMode}
                      </span>
                      <span className={styles.paymentAccount}>→ {p.account}</span>
                    </div>
                    <div className={styles.paymentMeta}>
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
                      className={`btn btn-sm ${styles.deleteBtn}`}
                      disabled={deletePaymentMut.isPending}
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
          <form onSubmit={handleAddPaymentSubmit} className={styles.formBox}>
            <div className={styles.formTitle}>Record Payment</div>

            {error && <div className={`alert-error ${styles.errorText}`}>{error}</div>}

            <div className={`grid-2 ${styles.formRow}`}>
              <div className={`form-group ${styles.formGroupInline}`}>
                <label>Amount (₹) <span className="required-star">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Max: ₹${balance.toLocaleString('en-IN')}`}
                />
              </div>
              <div className={`form-group ${styles.formGroupInline}`}>
                <label>Payment Date <span className="required-star">*</span></label>
                <NeoDatePicker value={paymentDate} onChange={setPaymentDate} />
              </div>
            </div>

            <div className={`grid-2 ${styles.formRow}`}>
              <div className={`form-group ${styles.formGroupInline}`}>
                <label>Payment Mode <span className="required-star">*</span></label>
                <NeoSelect
                  value={paymentMode}
                  onChange={setPaymentMode}
                  options={modeOptions}
                  placeholder="Select Mode"
                />
              </div>
              <div className={`form-group ${styles.formGroupInline}`}>
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
              <div className={`form-group ${styles.formRow}`}>
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
              <div className={styles.upiSection}>
                {selectedAccount === 'Other' && (
                  <div className={`form-group ${styles.formGroupInline}`}>
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
                <div className={`form-group ${styles.formGroupInline}`}>
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
                  transactionRef={`${recordId}-${Date.now()}`}
                  transactionNote={`Payment for ${title} ${recordId}`}
                />
              </div>
            )}

            <div className={`form-group ${styles.formRow}`}>
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
              className={`btn btn-primary ${styles.submitBtn}`}
              disabled={addPaymentMut.isPending}
            >
              {addPaymentMut.isPending ? 'Saving…' : 'Record Payment'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
