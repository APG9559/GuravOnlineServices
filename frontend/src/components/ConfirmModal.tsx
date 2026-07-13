import Modal from '@/components/Modal';

interface ConfirmModalProps {
  show: boolean;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  hideCancel?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  icon?: React.ReactNode;
  variant?: 'info' | 'danger';
}

export default function ConfirmModal({
  show,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  hideCancel,
  onConfirm,
  onCancel,
  icon,
  variant = 'info',
}: ConfirmModalProps) {
  if (!show) return null;

  return (
    <Modal title={title} onClose={() => onCancel?.()}>
      {icon && (
        <div style={{ fontSize: 48, marginBottom: '1rem', textAlign: 'center' }}>{icon}</div>
      )}
      <p
        style={{
          fontSize: 14,
          color: 'var(--text-muted)',
          marginBottom: '1.5rem',
          whiteSpace: 'pre-line',
          textAlign: 'center',
        }}
      >
        {message}
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        {onConfirm ? (
          <>
            <button
              className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
              onClick={() => {
                onConfirm();
                onCancel?.();
              }}
            >
              {confirmText}
            </button>
            {!hideCancel && (
              <button className="btn" onClick={() => onCancel?.()}>
                {cancelText}
              </button>
            )}
          </>
        ) : (
          <button className="btn btn-primary" onClick={() => onCancel?.()}>
            Okay
          </button>
        )}
      </div>
    </Modal>
  );
}
