interface SuccessModalProps {
  title: string;
  customerName: string;
  onClose: () => void;
  onPrint: () => void;
}

export default function SuccessModal({ title, customerName, onClose, onPrint }: SuccessModalProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card modal-card" style={{ width: '100%', maxWidth: 400, position: 'relative', textAlign: 'center', padding: '2rem' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
        >
          ✕
        </button>
        <div style={{ fontSize: 48, marginBottom: '1rem' }}>🎉</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: '0.5rem' }}>{title}</h3>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Record for {customerName} has been stored successfully.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => { onPrint(); onClose(); }}>
            🖨 Print Receipt
          </button>
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
