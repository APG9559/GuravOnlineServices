import { useEffect } from 'react';

export default function SplashScreen() {
  // Inject CSS animations for the splash screen
  useEffect(() => {
    const styleId = 'splash-screen-keyframes';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        @keyframes logo-pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        @keyframes progress-loading {
          0% { width: 0%; }
          50% { width: 75%; }
          100% { width: 100%; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'var(--bg, #f4f3ef)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        className="card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '2.5rem 3rem',
          maxWidth: '400px',
          width: '90%',
          transform: 'translateY(-20px)',
        }}
      >
        <img
          src="/G.png"
          alt="Gurav Online Services Logo"
          style={{
            width: '100px',
            height: '100px',
            marginBottom: '1.5rem',
            animation: 'logo-pulse 2s infinite ease-in-out',
          }}
        />
        <div style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text, #111)', marginBottom: '0.5rem' }}>
          Gurav Online Services
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted, #666)', marginBottom: '2rem' }}>
          Kolhapur Municipal Services
        </div>
        
        {/* Neo-Brutalist Loading Bar */}
        <div
          style={{
            width: '100%',
            height: '12px',
            background: '#fff',
            border: '2px solid #000',
            borderRadius: '4px',
            overflow: 'hidden',
            boxShadow: '2px 2px 0px #000',
          }}
        >
          <div
            style={{
              height: '100%',
              background: '#f1c40f', // bold neo-brutalist yellow
              animation: 'progress-loading 1.8s infinite linear',
              transformOrigin: 'left center',
            }}
          />
        </div>
      </div>
    </div>
  );
}
