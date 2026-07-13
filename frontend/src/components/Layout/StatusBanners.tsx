export function OfflineStatusBar() {
  return (
    <div
      style={{
        background: 'var(--danger-bg)',
        color: '#000000',
        borderBottom: '3px solid var(--border)',
        padding: '8px 16px',
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: 700,
        fontFamily: "'Space Grotesk', sans-serif",
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="1" y1="1" x2="23" y2="23"></line>
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.5"></path>
        <path d="M5 12.5a10.94 10.94 0 0 1 5.17-2.39"></path>
        <path d="M10.71 5.05A16 16 0 0 1 22.5 8"></path>
        <path d="M1.5 8a16 16 0 0 1 7.7-2.88"></path>
        <path d="M12 20h.01"></path>
      </svg>
      Working Offline — Some actions may be unavailable
    </div>
  );
}

export function OnlineRestoredBar() {
  return (
    <div
      style={{
        background: 'var(--success-bg)',
        color: '#000000',
        borderBottom: '3px solid var(--border)',
        padding: '8px 16px',
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: 700,
        fontFamily: "'Space Grotesk', sans-serif",
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      Connection Restored!
    </div>
  );
}
