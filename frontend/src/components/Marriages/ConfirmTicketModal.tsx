import { useState, useEffect } from 'react';
import { MarriageTicket } from '@/types';
import { PAYMENT_MODES } from '@/constants';
import NeoSelect from '@/components/NeoSelect';
import NeoDatePicker from '@/components/NeoDatePicker';
import { usePaymentAccounts } from '@/hooks/usePaymentAccounts';
import UpiQrCode from '@/components/UpiQrCode';
import styles from './ConfirmTicketModal.module.css';

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
    <div className={styles.overlay}>
      <div className={`card ${styles.card}`}>
        <button onClick={onClose} disabled={isLoading} className={styles.closeBtn}>
          ✕
        </button>
        <h3 className={styles.title}>Confirm Ticket — {ticket.ticketNumber}</h3>

        <div className={styles.infoBox}>
          <div className={styles.infoLabel}>Customer Name</div>
          <div className={styles.infoValue}>{ticket.contactName}</div>
          <div className={styles.infoRow}>
            <div>
              <span className={styles.infoLabel}>Phone: </span>
              <span className={styles.phoneValue}>{ticket.phone}</span>
            </div>
            <div>
              <span className={styles.infoLabel}>Amount Charged: </span>
              <span className={styles.amountValue}>
                ₹{Number(ticket.amountCharged).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.checkboxRow}>
            <input
              type="checkbox"
              id="recordPayment"
              checked={recordPayment}
              onChange={(e) => {
                setRecordPayment(e.target.checked);
                setError('');
              }}
              className={styles.checkbox}
            />
            <label htmlFor="recordPayment" className={styles.checkboxLabel}>
              Record Advance Payment
            </label>
          </div>

          {recordPayment && (
            <div className={styles.paymentFields}>
              <div>
                <label className={styles.fieldLabel}>Amount Paid (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className={styles.fieldInput}
                  required
                />
              </div>

              <div className={styles.fieldGrid}>
                <div>
                  <label className={styles.fieldLabel}>Payment Mode *</label>
                  <NeoSelect
                    value={paymentMode}
                    onChange={setPaymentMode}
                    options={modeOptions}
                    placeholder="Select Mode"
                  />
                </div>
                <div>
                  <label className={styles.fieldLabel}>Target Account *</label>
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
                <div>
                  <label className={styles.fieldLabel}>Specify Account *</label>
                  <input
                    type="text"
                    value={customAccount}
                    onChange={(e) => setCustomAccount(e.target.value)}
                    placeholder="e.g. Vaishali Gurav GPay"
                    className={styles.fieldInput}
                    required
                  />
                </div>
              )}

              {paymentMode === 'UPI' && (
                <div className={styles.upiSection}>
                  {selectedAccount === 'Other' && (
                    <div>
                      <label className={styles.fieldLabel}>Payee Name *</label>
                      <input
                        type="text"
                        value={payeeName}
                        onChange={(e) => setPayeeName(e.target.value)}
                        placeholder="e.g. Gurav Online Services"
                        className={styles.fieldInput}
                        required
                      />
                    </div>
                  )}
                  <div>
                    <label className={styles.fieldLabel}>Payee UPI ID *</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. merchant@okaxis"
                      className={styles.fieldInput}
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
                <label className={styles.fieldLabel}>Payment Date *</label>
                <NeoDatePicker value={paymentDate} onChange={setPaymentDate} />
              </div>

              <div>
                <label className={styles.fieldLabel}>Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional remarks"
                  className={`${styles.fieldInput} ${styles.textarea}`}
                />
              </div>
            </div>
          )}

          {error && <div className={styles.errorBox}>⚠️ {error}</div>}

          <div className={styles.buttonRow}>
            <button type="button" className="btn" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
            <button
              type="submit"
              className={`btn btn-primary ${styles.submitBtn}`}
              disabled={isLoading}
            >
              {isLoading ? 'Confirming...' : 'Confirm Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
