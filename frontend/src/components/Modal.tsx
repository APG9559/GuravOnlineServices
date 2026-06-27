import React from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card modal-card" style={{ width: '100%', maxWidth: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', padding: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '2.5px solid var(--border)' }}>
          <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text)' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}>✕</button>
        </div>
        <div style={{ overflowY: 'auto', padding: '1.5rem', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
