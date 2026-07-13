import React from 'react';
import styles from './Modal.module.css';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className={styles.overlay}>
      <div className={`card ${styles.card}`}>
        <div className={styles.header}>
          <div className={styles.title}>{title}</div>
          <button onClick={onClose} className={styles.closeBtn}>
            ✕
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
