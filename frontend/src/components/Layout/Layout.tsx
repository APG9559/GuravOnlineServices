import { useState, Suspense } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import ExpensesModal from '@/components/ExpensesModal';
import ProfileModal from '@/components/ProfileModal';
import { useRegisterSW } from 'virtual:pwa-register/react';
import SwipeRefresh from './SwipeRefresh';
import RouteErrorBoundary from '@/components/RouteErrorBoundary';
import { DesktopDropdown } from './Dropdowns';
import { OfflineStatusBar, OnlineRestoredBar } from './StatusBanners';
import PageSliderTransition from './PageSliderTransition';
import PwaUpdateToast from './PwaUpdateToast';
import { useTheme } from '@/hooks/useTheme';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { dashboardLink, serviceGroups, bottomNavLinks } from './navData';
import UserDropdown from './UserDropdown';
import MobileMenu from './MobileMenu';
import { SunIcon, MoonIcon } from './icons';

function PageLoader() {
  return (
    <div className="page-loader-container">
      <div className="page-loader-box">
        <img
          src="/G.png"
          style={{ width: '80%', height: '80%', objectFit: 'contain' }}
          alt="Loading..."
        />
      </div>
      <div
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--text)',
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      >
        Loading page...
      </div>
    </div>
  );
}

export default function Layout() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const { isOnline, showOnlineStatus } = useOnlineStatus();
  const { theme, toggleTheme } = useTheme();

  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showExpenses, setShowExpenses] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [animating, setAnimating] = useState(false);

  const handleTransitionNavigate = (to: string) => {
    if (to === location.pathname) return;
    setAnimating(true);
    setTimeout(() => navigate(to), 600);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!isOnline && <OfflineStatusBar />}
      {isOnline && showOnlineStatus && <OnlineRestoredBar />}

      {animating && <PageSliderTransition onComplete={() => setAnimating(false)} />}

      <nav
        style={{
          background: 'var(--surface)',
          borderBottom: '3px solid var(--border)',
          padding: '0 1.5rem',
          display: 'flex',
          alignItems: 'center',
          height: 64,
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginRight: 'auto',
            cursor: 'pointer',
          }}
          onClick={() => handleTransitionNavigate('/')}
        >
          <div className="nav-logo-box">
            <img
              src="/G.png"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              alt="Logo"
            />
          </div>
        </div>

        {/* Desktop nav */}
        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <NavLink
            to={dashboardLink.to}
            end={dashboardLink.end}
            className="nav-item"
            onClick={(e) => {
              if (e.button === 0 && !e.metaKey && !e.altKey && !e.ctrlKey && !e.shiftKey) {
                e.preventDefault();
                handleTransitionNavigate(dashboardLink.to);
              }
            }}
          >
            {dashboardLink.icon}
            <span>{dashboardLink.label}</span>
          </NavLink>

          {serviceGroups.map((group) => (
            <DesktopDropdown
              key={group.label}
              group={group}
              onNavigate={handleTransitionNavigate}
            />
          ))}

          {bottomNavLinks.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={(e) => {
                if (e.button === 0 && !e.metaKey && !e.altKey && !e.ctrlKey && !e.shiftKey) {
                  e.preventDefault();
                  handleTransitionNavigate(to);
                }
              }}
              className="nav-item"
            >
              {icon}
              <span>{label}</span>
            </NavLink>
          ))}

          {isAdmin && (
            <NavLink
              to="/users"
              onClick={(e) => {
                if (e.button === 0 && !e.metaKey && !e.altKey && !e.ctrlKey && !e.shiftKey) {
                  e.preventDefault();
                  handleTransitionNavigate('/users');
                }
              }}
              className="nav-item"
            >
              <UsersIconSmall />
              <span>Users</span>
            </NavLink>
          )}

          {/* Theme toggle + User dropdown */}
          <div
            style={{
              marginLeft: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <button
              type="button"
              onClick={toggleTheme}
              className="btn-icon-neo"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>
            <UserDropdown
              open={profileOpen}
              onOpenChange={setProfileOpen}
              onProfileOpen={() => setProfileModalOpen(true)}
              onExpensesOpen={() => setShowExpenses(true)}
              onNavigate={handleTransitionNavigate}
            />
          </div>
        </div>

        {/* Mobile controls */}
        <div
          className="mobile-nav-controls"
          style={{ display: 'none', alignItems: 'center', gap: 10 }}
        >
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: '6px',
              border: '2px solid var(--border)',
              background: 'var(--accent)',
              color: '#000000',
              cursor: 'pointer',
              boxShadow: '2px 2px 0px var(--border)',
              outline: 'none',
              padding: 0,
            }}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
          <button
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            style={{
              background: 'none',
              border: 'none',
              fontSize: 22,
              color: 'var(--text)',
              padding: '4px 8px',
              lineHeight: 1,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={handleTransitionNavigate}
        onProfileOpen={() => setProfileModalOpen(true)}
        onExpensesOpen={() => setShowExpenses(true)}
        onLogout={handleLogout}
      />

      <SwipeRefresh>
        <main
          style={{ padding: '1.5rem', flex: 1, maxWidth: 1450, width: '100%', margin: '0 auto' }}
        >
          <Suspense fallback={<PageLoader />}>
            <RouteErrorBoundary>
              <Outlet />
            </RouteErrorBoundary>
          </Suspense>
        </main>
      </SwipeRefresh>

      {showExpenses && user && <ExpensesModal user={user} onClose={() => setShowExpenses(false)} />}
      {profileModalOpen && <ProfileModal onClose={() => setProfileModalOpen(false)} />}

      <PwaUpdateToast
        needRefresh={needRefresh}
        offlineReady={offlineReady}
        setNeedRefresh={setNeedRefresh}
        setOfflineReady={setOfflineReady}
        updateServiceWorker={updateServiceWorker}
      />

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-nav-controls { display: flex !important; }
          main { padding: 1rem !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu { display: none !important; }
          .mobile-nav-controls { display: none !important; }
        }
        .dropdown-item {
          display: block;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 700;
          color: var(--text);
          text-decoration: none;
          transition: all 0.1s ease;
        }
        .dropdown-item:hover {
          background: var(--bg);
        }
        .dropdown-item.active {
          background: var(--accent-light) !important;
        }
        @keyframes pageSlide {
          0% { transform: translateX(100%); }
          30% { transform: translateX(0%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
        .pwa-toast {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 99999;
          background: var(--surface);
          color: var(--text);
          border: 3px solid var(--border);
          border-radius: var(--radius);
          padding: 16px;
          box-shadow: var(--neo-shadow);
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 360px;
          width: calc(100% - 40px);
          animation: slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideInUp {
          from { transform: translateY(100px) scale(0.9); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function UsersIconSmall() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="8" cy="7" r="4"></circle>
      <polyline points="22 9 16 15 13 12"></polyline>
    </svg>
  );
}
