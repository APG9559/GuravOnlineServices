import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/', label: 'Dashboard', end: true },
    { to: '/affidavits', label: 'Affidavit / Notary' },
    { to: '/marriages', label: 'Marriage Reg.' },
    { to: '/birth-death', label: 'Birth/Death Cert.' },
    { to: '/records', label: 'Records' },
    { to: '/settings', label: 'Settings' },
    ...(isAdmin ? [{ to: '/users', label: 'Users' }] : []),
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── Top nav bar ── */}
      <nav style={{
        background: 'var(--surface)',
        borderBottom: '0.5px solid var(--border)',
        padding: '0 1rem',
        display: 'flex',
        alignItems: 'center',
        height: 52,
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}>
        <span style={{ fontWeight: 500, fontSize: 15, marginRight: 'auto' }}>
          🏪 Gurav Online Services
        </span>

        {/* Desktop nav links */}
        <div className="desktop-nav" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          {navLinks.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                padding: '6px 14px',
                borderRadius: 'var(--radius)',
                fontSize: 13,
                textDecoration: 'none',
                background: isActive ? 'var(--bg)' : 'transparent',
                color: isActive ? 'var(--text)' : 'var(--text-muted)',
                transition: 'all 0.15s',
              })}
            >
              {label}
            </NavLink>
          ))}

          <div style={{
            marginLeft: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderLeft: '0.5px solid var(--border)',
            paddingLeft: 12,
          }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {user?.name}
              <span className={`badge ${user?.role === 'admin' ? 'badge-amber' : 'badge-blue'}`} style={{ marginLeft: 6 }}>
                {user?.role}
              </span>
            </span>
            <button className="btn btn-sm" onClick={handleLogout}>Sign out</button>
          </div>
        </div>

        {/* Mobile hamburger button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            fontSize: 22,
            color: 'var(--text)',
            padding: '4px 8px',
            lineHeight: 1,
          }}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* ── Mobile slide-down menu ── */}
      {menuOpen && (
        <div className="mobile-menu" style={{
          position: 'fixed',
          top: 52,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 15,
          background: 'var(--surface)',
          display: 'flex',
          flexDirection: 'column',
          borderTop: '0.5px solid var(--border)',
          overflowY: 'auto',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', padding: '8px 0', flex: 1 }}>
            {navLinks.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMenuOpen(false)}
                style={({ isActive }) => ({
                  padding: '14px 20px',
                  fontSize: 15,
                  textDecoration: 'none',
                  background: isActive ? 'var(--bg)' : 'transparent',
                  color: isActive ? 'var(--text)' : 'var(--text-muted)',
                  borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                  transition: 'all 0.15s',
                })}
              >
                {label}
              </NavLink>
            ))}
          </div>

          {/* User info + sign out at bottom */}
          <div style={{
            padding: '16px 20px',
            borderTop: '0.5px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              {user?.name}
              <span className={`badge ${user?.role === 'admin' ? 'badge-amber' : 'badge-blue'}`} style={{ marginLeft: 8 }}>
                {user?.role}
              </span>
            </span>
            <button className="btn btn-sm" onClick={handleLogout}>Sign out</button>
          </div>
        </div>
      )}

      <main style={{ padding: '1.5rem', flex: 1, maxWidth: 1200, width: '100%', margin: '0 auto' }}>
        <Outlet />
      </main>

      {/* ── CSS for mobile/desktop toggle ── */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
          main { padding: 1rem !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu { display: none !important; }
          .mobile-menu-btn { display: none !important; }
        }
      `}</style>
    </div>
  );
}
