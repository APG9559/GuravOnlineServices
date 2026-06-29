import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor;
if (isCapacitor) {
  import('@capgo/capacitor-passkey').then(({ CapacitorPasskey }) => {
    CapacitorPasskey.autoShimWebAuthn().catch((err) => {
      console.error('[CapacitorPasskey] Auto-shim initialization failed:', err);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
