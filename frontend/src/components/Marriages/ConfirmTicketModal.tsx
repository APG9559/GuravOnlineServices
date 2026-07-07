import { useState, useEffect } from 'react';
import { MarriageTicket, PAYMENT_MODES } from '@/types';
import NeoSelect from '@/components/NeoSelect';
import NeoDatePicker from '@/components/NeoDatePicker';
import { usePaymentAccounts } from '@/hooks/usePaymentAccounts';
import UpiQrCode from '@/components/UpiQrCode';

interface ConfirmTicketModalProps {
  ticket: MarriageTicket;
  onClose: () => void;
  onConfirm: (paymentData?: {
    amount: number;
    paymentMode: string;
    account: string;
    paymentDate: string;
    notes?: string;
  }) => void;
  isLoading?: boolean;
}

export default function ConfirmTicketModal({
  ticket,
  onClose,
  onConfirm,
  isLoading = false,
}: ConfirmTicketModalProps) {
  const [recordPayment, setRecordPayment] = useState(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (recordPayment) {
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

      onConfirm({
        amount: amtVal,
        paymentMode,
        account: resolvedAccount,
        paymentDate,
        notes: notes.trim() || undefined,
      });
    } else {
      onConfirm(undefined);
    }
  };

  const modeOptions = PAYMENT_MODES.map((m) => ({ value: m, label: m }));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card modal-card" style={{ width: '100%', maxWidth: 480, position: 'relative', padding: '1.5rem 2rem', maxHeight: '90vh', overflowY: 'auto' }}>
        <button
          onClick={onClose}
          disabled={isLoading}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          ✕
        </button>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>
          Confirm Ticket — {ticket.ticketNumber}
        </h3>

        <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Customer Name</div>
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>{ticket.contactName}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Phone: </span>
              <span style={{ fontWeight: 500, fontSize: '13px' }}>{ticket.phone}</span>
            </div>
            <div>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Amount Charged: </span>
              <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--accent)' }}>₹{Number(ticket.amountCharged).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Toggle for Advance Payment */}
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="recordPayment"
              checked={recordPayment}
              onChange={(e) => {
                setRecordPayment(e.target.checked);
                setError('');
              }}
              style={{ cursor: 'pointer', width: '16px', height: '16px' }}
            />
            <label htmlFor="recordPayment" style={{ fontWeight: 600, fontSize: '14px', cursor: 'pointer', userSelect: 'none' }}>
              Record Advance Payment
            </label>
          </div>

          {recordPayment && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', border: '1px dashed var(--border)', borderRadius: '6px', marginBottom: '1rem', background: 'var(--surface)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Amount Paid (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  style={{ width: '100%', padding: '8px 10px', border: '2px solid var(--border)', borderRadius: '4px' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Payment Mode *</label>
                  <NeoSelect
                    value={paymentMode}
                    onChange={setPaymentMode}
                    options={modeOptions}
                    placeholder="Select Mode"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Target Account *</label>
                  <NeoSelect
                    value={selectedAccount}
                    onChange={setSelectedAccount}
                    options={accountOptions}
                    placeholder={paymentMode ? "Select Account" : "Select Mode First"}
                    disabled={!paymentMode}
                  />
                </div>
              </div>

              {isOtherSelected && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Specify Account *</label>
                  <input
                    type="text"
                    value={customAccount}
                    onChange={(e) => setCustomAccount(e.target.value)}
                    placeholder="e.g. Vaishali Gurav GPay"
                    style={{ width: '100%', padding: '8px 10px', border: '2px solid var(--border)', borderRadius: '4px' }}
                    required
                  />
                </div>
              )}

              {paymentMode === 'UPI' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                  {selectedAccount === 'Other' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Payee Name *</label>
                      <input
                        type="text"
                        value={payeeName}
                        onChange={(e) => setPayeeName(e.target.value)}
                        placeholder="e.g. Gurav Online Services"
                        style={{ width: '100%', padding: '8px 10px', border: '2px solid var(--border)', borderRadius: '4px' }}
                        required
                      />
                    </div>
                  )}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Payee UPI ID *</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. merchant@okaxis"
                      style={{ width: '100%', padding: '8px 10px', border: '2px solid var(--border)', borderRadius: '4px' }}
                      required
                    />
                  </div>

                  <UpiQrCode
                    upiId={upiId}
                    payeeName={payeeName}
                    amount={parseFloat(amount) || 0}
                    transactionRef={`${ticket.ticketNumber || ticket.id}-${Date.now()}`}
                    transactionNote={`Payment for Ticket ${ticket.ticketNumber || ticket.id}`}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Payment Date *</label>
                <NeoDatePicker
                  value={paymentDate}
                  onChange={setPaymentDate}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional remarks"
                  style={{ width: '100%', padding: '8px 10px', border: '2px solid var(--border)', borderRadius: '4px', resize: 'vertical', fontSize: '13px', minHeight: '60px' }}
                />
              </div>
            </div>
          )}

          {error && (
            <div style={{ color: 'var(--danger)', fontSize: '13px', fontWeight: 500, marginBottom: '1rem', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '4px', border: '1px solid var(--danger)' }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isLoading}
              style={{ padding: '8px 16px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
              style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {isLoading ? 'Confirming...' : 'Confirm Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
