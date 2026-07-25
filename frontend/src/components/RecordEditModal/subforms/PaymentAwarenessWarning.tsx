import styles from '../../RecordEditModal.module.css';

interface PaymentAwarenessWarningProps {
  totalPaid: number;
  originalAmount: number;
  currentAmount: number;
  acknowledgedAmountChange: boolean;
  setAcknowledgedAmountChange: (val: boolean) => void;
}

export default function PaymentAwarenessWarning({
  totalPaid,
  originalAmount,
  currentAmount,
  acknowledgedAmountChange,
  setAcknowledgedAmountChange,
}: PaymentAwarenessWarningProps) {
  const diff = currentAmount - originalAmount;

  return (
    <div className={styles.warningBox}>
      <strong>
        ⚠ This record has ₹{totalPaid.toLocaleString('en-IN')} already paid against it.
      </strong>
      <div className={styles.warningRow}>
        <span>Original amount:</span>
        <span>₹{originalAmount.toLocaleString('en-IN')}</span>
      </div>
      <div className={styles.warningRowBold}>
        <span>New amount:</span>
        <span>
          ₹{currentAmount.toLocaleString('en-IN')} ({diff > 0 ? '+' : ''}₹
          {diff.toLocaleString('en-IN')})
        </span>
      </div>
      <label className={styles.ackLabel}>
        <input
          type="checkbox"
          checked={acknowledgedAmountChange}
          onChange={(e) => setAcknowledgedAmountChange(e.target.checked)}
          className={styles.ackCheckbox}
        />
        <span className={styles.ackText}>
          I understand this record has existing payments and want to proceed anyway.
        </span>
      </label>
    </div>
  );
}
