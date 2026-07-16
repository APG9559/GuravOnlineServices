import styles from './AffidavitMismatchModal.module.css';

interface Mismatch {
  purpose: string;
  ticketAmount: number;
  actualAmount: number;
}

interface AffidavitMismatchModalProps {
  mismatches: Mismatch[];
  onClose: () => void;
  onConfirm: (updateAffidavitAmounts: boolean) => void;
  isLoading?: boolean;
}

export default function AffidavitMismatchModal({
  mismatches,
  onClose,
  onConfirm,
  isLoading = false,
}: AffidavitMismatchModalProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <button onClick={onClose} disabled={isLoading} className={styles.closeBtn}>
          ✕
        </button>
        <h3 className={styles.title} style={{ color: 'var(--warning, #eab308)' }}>
          ⚠️ Cost Mismatch Detected
        </h3>
        
        <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 12, lineHeight: '1.5' }}>
          The following linked affidavits have different amounts in the database compared to the estimated amounts on the ticket:
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Purpose</th>
              <th style={{ textAlign: 'right' }}>Ticket Est.</th>
              <th style={{ textAlign: 'right' }}>Linked Aff.</th>
            </tr>
          </thead>
          <tbody>
            {mismatches.map((m, idx) => (
              <tr key={idx}>
                <td>{m.purpose}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{m.ticketAmount}</td>
                <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>₹{m.actualAmount}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{
          background: 'var(--warning-bg, #fef3c7)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius, 8px)',
          padding: '12px',
          marginTop: 8,
          marginBottom: 16,
          fontSize: 13,
          lineHeight: '1.4'
        }}>
          <strong style={{ color: '#854d0e' }}>Should the amount specified in the ticket be considered as the Affidavit's Amount?</strong>
          <div style={{ marginTop: 6, color: '#451a03' }}>
            <strong>Yes:</strong> Updates the actual linked affidavit records' amount in the database to match the ticket's estimate.
            <br />
            <strong>No:</strong> Keeps the actual affidavit records' original amount as-is.
          </div>
        </div>

        <div className={styles.buttonRow}>
          <button type="button" className="btn" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onConfirm(false)}
              disabled={isLoading}
            >
              No (Keep original)
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onConfirm(true)}
              disabled={isLoading}
            >
              Yes (Update Affidavit)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
