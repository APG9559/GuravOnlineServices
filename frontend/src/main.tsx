import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const isCapacitor = typeof window !== 'undefined' && 'Capacitor' in (window as unknown as Record<string, unknown>);
if (isCapacitor) {
  import('@capgo/capacitor-passkey').then(({ CapacitorPasskey }) => {
    CapacitorPasskey.autoShimWebAuthn().catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[CapacitorPasskey] Auto-shim initialization failed:', err);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
