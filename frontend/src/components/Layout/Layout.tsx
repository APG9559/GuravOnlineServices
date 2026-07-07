import { useState, useEffect, useRef, Suspense } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import ExpensesModal from '@/components/ExpensesModal';
import ProfileModal from '@/components/ProfileModal';
import { useRegisterSW } from 'virtual:pwa-register/react';
import SwipeRefresh from './SwipeRefresh';
import RouteErrorBoundary from '@/components/RouteErrorBoundary';


interface ServiceItem {
  to: string;
  label: string;
}

interface ServiceGroup {
  label: string;
  items: ServiceItem[];
  activePaths: string[];
}

function DesktopDropdown({ group, onNavigate }: { group: ServiceGroup; onNavigate: (to: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isActive = group.activePaths.includes(location.pathname);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    setIsOpen(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  return (
    <div
      ref={dropdownRef}
      className="nav-dropdown-container"
      style={{ position: 'relative' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`nav-item ${isActive ? 'active' : ''}`}
        style={{
          cursor: 'pointer',
          background: isActive ? 'var(--accent-light)' : 'transparent',
          border: '2px solid transparent',
          outline: 'none',
        }}
      >
        <span>{group.label}</span>
        <span style={{ fontSize: 9, marginLeft: 6, display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.1s' }}>▼</span>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          background: 'var(--surface)',
          border: '3px solid var(--border)',
          borderRadius: '8px',
          boxShadow: '4px 4px 0px var(--border)',
          padding: '6px 0',
          minWidth: 180,
          zIndex: 100,
          marginTop: 4,
        }}>
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={(e) => {
                if (e.button === 0 && !e.metaKey && !e.altKey && !e.ctrlKey && !e.shiftKey) {
                  e.preventDefault();
                  onNavigate(item.to);
                }
              }}
              className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
              style={({ isActive }) => ({
                display: 'block',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--text)',
                textDecoration: 'none',
                background: isActive ? 'var(--accent-light)' : 'transparent',
                borderBottom: '1px solid var(--border-light)',
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}


function MobileAccordion({ group, onCloseMenu, onNavigate }: { group: ServiceGroup; onCloseMenu: () => void; onNavigate: (to: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isActive = group.activePaths.includes(location.pathname);

  return (
    <div style={{ borderBottom: '2.5px solid var(--border)' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 20px',
          fontSize: 15,
          fontWeight: 700,
          background: isActive ? 'var(--accent-light)' : 'transparent',
          color: 'var(--text)',
          border: 'none',
          textAlign: 'left',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        <span>{group.label}</span>
        <span style={{ fontSize: 11 }}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div style={{ background: 'var(--bg)', borderTop: '2.5px solid var(--border)' }}>
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={(e) => {
                if (e.button === 0 && !e.metaKey && !e.altKey && !e.ctrlKey && !e.shiftKey) {
                  e.preventDefault();
                  onCloseMenu();
                  onNavigate(item.to);
                }
              }}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              style={({ isActive }) => ({
                display: 'flex',
                padding: '14px 30px',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--text)',
                textDecoration: 'none',
                background: isActive ? 'var(--accent-light)' : 'transparent',
                borderBottom: '1px solid var(--border-light)',
                borderRadius: 0,
                borderLeft: '3px solid transparent',
              })}
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

function PageLoader() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: 16 }}>
      <div
        style={{
          width: 55,
          height: 55,
          background: 'var(--surface)',
          border: '3px solid var(--border)',
          borderRadius: '12px',
          boxShadow: '4px 4px 0px var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'logo-pulse 1.5s infinite ease-in-out',
        }}
      >
        <img src="/G.png" style={{ width: '80%', height: '80%', objectFit: 'contain' }} alt="Loading..." />
      </div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', fontFamily: "'Space Grotesk', sans-serif" }}>Loading page...</div>
    </div>
  );
}

export default function Layout() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOnlineStatus, setShowOnlineStatus] = useState(false);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineStatus(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOnlineStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-hide the "Connection restored" banner after 3 seconds
  useEffect(() => {
    if (isOnline && showOnlineStatus) {
      const timer = setTimeout(() => {
        setShowOnlineStatus(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, showOnlineStatus]);

  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showExpenses, setShowExpenses] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [animating, setAnimating] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setAnimating(true);
    const timer = setTimeout(() => {
      setAnimating(false);
    }, 700);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleTransitionNavigate = (to: string) => {
    setAnimating(true);
    setTimeout(() => {
      navigate(to);
    }, 300);
  };

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const dashboardLink = {
    to: '/',
    label: 'Dashboard',
    end: true,
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9"></rect>
        <rect x="14" y="3" width="7" height="5"></rect>
        <rect x="14" y="12" width="7" height="9"></rect>
        <rect x="3" y="16" width="7" height="5"></rect>
      </svg>
    )
  };

  const serviceGroups: ServiceGroup[] = [
    {
      label: 'KMC Services',
      activePaths: ['/marriages', '/birth-death', '/trade-licenses', '/water-supply', '/property-tax'],
      items: [
        { to: '/marriages', label: 'Marriages' },
        { to: '/birth-death', label: 'Birth/Death' },
        { to: '/trade-licenses', label: 'Trade Licenses' },
        { to: '/water-supply', label: 'Water Supply' },
        { to: '/property-tax', label: 'Property Tax' },
      ],
    },
    {
      label: 'CSC Services',
      activePaths: ['/pan-cards', '/passports'],
      items: [
        { to: '/pan-cards', label: 'PAN Cards' },
        { to: '/passports', label: 'Passports' },
      ],
    },
    {
      label: 'Aaple Sarkar',
      activePaths: ['/affidavits', '/property-cards', '/shop-act', '/gazettes', '/voter-cards'],
      items: [
        { to: '/affidavits', label: 'Affidavits' },
        { to: '/property-cards', label: 'Property Cards' },
        { to: '/shop-act', label: 'Shop Act' },
        { to: '/gazettes', label: 'Gazette' },
        { to: '/voter-cards', label: 'Voter Cards' },
      ],
    },
  ];

  const bottomNavLinks = [
    {
      to: '/records',
      label: 'Records',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
      )
    },
    {
      to: '/payments',
      label: 'Payments',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
          <line x1="12" y1="4" x2="12" y2="20"></line>
          <line x1="2" y1="12" x2="22" y2="12"></line>
        </svg>
      )
    },
    {
      to: '/customers',
      label: 'Customers',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      )
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      )
    },
    ...(isAdmin ? [{
      to: '/users',
      label: 'Users',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="8" cy="7" r="4"></circle>
          <polyline points="22 9 16 15 13 12"></polyline>
        </svg>
      )
    }, {
      to: '/audit-logs',
      label: 'Audit Logs',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9"></path>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
        </svg>
      )
    }] : []),
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Offline Status Bar */}
      {!isOnline && (
        <div style={{
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
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" y1="1" x2="23" y2="23"></line>
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.5"></path>
            <path d="M5 12.5a10.94 10.94 0 0 1 5.17-2.39"></path>
            <path d="M10.71 5.05A16 16 0 0 1 22.5 8"></path>
            <path d="M1.5 8a16 16 0 0 1 7.7-2.88"></path>
            <path d="M12 20h.01"></path>
          </svg>
          Working Offline — Some actions may be unavailable
        </div>
      )}

      {/* Online Restored Bar */}
      {isOnline && showOnlineStatus && (
        <div style={{
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
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          Connection Restored!
        </div>
      )}

      {/* Page transition slider */}
      {animating && (
        <div
          className="page-slider-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100vh',
            background: 'rgba(250, 169, 48, 1)',
            zIndex: 99999,
            pointerEvents: 'all',
            animation: 'pageSlide 1.0s cubic-bezier(0.85, 0, 0.15, 1) forwards',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 100,
              height: 100,
              background: '#ffffff',
              border: '4px solid var(--border)',
              borderRadius: '20px',
              boxShadow: '6px 6px 0px var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: 10,
            }}
          >
            <img
              src='/G.png'
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              alt="G Logo"
            />
          </div>
        </div>
      )}
      {/* ── Premium Top nav bar ── */}
      <nav style={{
        background: 'var(--surface)',
        borderBottom: '3px solid var(--border)',
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        height: 64,
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}>
        {/* Brand Logo & Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 'auto', cursor: 'pointer' }} onClick={() => handleTransitionNavigate('/')}>
          <div style={{
            width: 34,
            height: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--border)',
            borderRadius: '6px',
            overflow: 'hidden',
          }}>
            <img src='/G.png' style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Logo" />
          </div>
        </div>

        {/* Desktop nav links */}
        <div className="desktop-nav" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
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
            <DesktopDropdown key={group.label} group={group} onNavigate={handleTransitionNavigate} />
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

          {/* User Profile & Sign Out Dropdown */}
          <div style={{
            marginLeft: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderLeft: '2.5px solid var(--border)',
            paddingLeft: 14,
            position: 'relative',
          }}>
            {/* Theme Toggle Button */}
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
                transition: 'all 0.1s ease',
              }}
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translate(-1px, -1px)';
                e.currentTarget.style.boxShadow = '3px 3px 0px var(--border)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '2px 2px 0px var(--border)';
              }}
            >
              {theme === 'light' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={() => setProfileOpen(!profileOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 4,
                outline: 'none',
              }}
            >
              <div style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'var(--accent-light)',
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 12,
                border: '2px solid var(--border)',
              }}>
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 4 }}>
                {user?.name}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: profileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </button>

            {profileOpen && (
              <>
                <div
                  onClick={() => setProfileOpen(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                />
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  background: 'var(--surface)',
                  border: '3px solid var(--border)',
                  borderRadius: '8px',
                  boxShadow: '4px 4px 0px var(--border)',
                  padding: '6px 0',
                  minWidth: 150,
                  zIndex: 100,
                  marginTop: 8,
                }}>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setProfileModalOpen(true);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 16px',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--text)',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid var(--border-light)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    My Profile
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setShowExpenses(true);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 16px',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--text)',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid var(--border-light)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
                      <line x1="12" y1="4" x2="12" y2="20"></line>
                    </svg>
                    My Expenses
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      handleLogout();
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 16px',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--danger)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Theme Toggle & hamburger button */}
        <div className="mobile-nav-controls" style={{ display: 'none', alignItems: 'center', gap: 10 }}>
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
            {theme === 'light' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            )}
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

      {/* ── Mobile slide-down menu ── */}
      {menuOpen && (
        <div className="mobile-menu" style={{
          position: 'fixed',
          top: 64,
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
            <NavLink
              to={dashboardLink.to}
              end={dashboardLink.end}
              onClick={(e) => {
                if (e.button === 0 && !e.metaKey && !e.altKey && !e.ctrlKey && !e.shiftKey) {
                  e.preventDefault();
                  setMenuOpen(false);
                  handleTransitionNavigate(dashboardLink.to);
                }
              }}
              className="nav-item"
              style={({ isActive }) => ({
                padding: '14px 20px',
                fontSize: 15,
                borderRadius: 0,
                background: isActive ? 'var(--accent-light)' : 'transparent',
                color: isActive ? 'var(--text)' : 'var(--text-muted)',
                borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                borderBottom: '2.5px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              })}
            >
              {dashboardLink.icon}
              <span>{dashboardLink.label}</span>
            </NavLink>

            {serviceGroups.map((group) => (
              <MobileAccordion
                key={group.label}
                group={group}
                onCloseMenu={() => setMenuOpen(false)}
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
                    setMenuOpen(false);
                    handleTransitionNavigate(to);
                  }
                }}
                className="nav-item"
                style={({ isActive }) => ({
                  padding: '14px 20px',
                  fontSize: 15,
                  borderRadius: 0,
                  background: isActive ? 'var(--accent-light)' : 'transparent',
                  color: isActive ? 'var(--text)' : 'var(--text-muted)',
                  borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                  borderBottom: '2.5px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                })}
              >
                {icon}
                <span>{label}</span>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--accent-light)',
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: 12,
              }}>
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>
                {user?.name}
                <span className={`badge ${user?.role === 'admin' ? 'badge-amber' : 'badge-blue'}`} style={{ marginLeft: 8 }}>
                  {user?.role}
                </span>
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  setMenuOpen(false);
                  setProfileModalOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                Profile
              </button>
              <button
                type="button"
                className="btn btn-sm btn-success-soft"
                onClick={() => {
                  setMenuOpen(false);
                  setShowExpenses(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'var(--success-bg)',
                  color: 'var(--success)',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                Expenses
              </button>
              <button className="btn btn-sm btn-danger-soft" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      <SwipeRefresh>
        <main style={{ padding: '1.5rem', flex: 1, maxWidth: 1450, width: '100%', margin: '0 auto' }}>
          <Suspense fallback={<PageLoader />}>
            <RouteErrorBoundary>
              <Outlet />
            </RouteErrorBoundary>
          </Suspense>
        </main>
      </SwipeRefresh>

      {showExpenses && user && (
        <ExpensesModal user={user} onClose={() => setShowExpenses(false)} />
      )}

      {profileModalOpen && (
        <ProfileModal onClose={() => setProfileModalOpen(false)} />
      )}

      {/* PWA Update / Offline Ready Toasts */}
      {(needRefresh || offlineReady) && (
        <div className="pwa-toast">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '6px',
              background: needRefresh ? 'var(--accent)' : 'var(--success-bg)',
              border: '2.5px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 14,
              boxShadow: '2px 2px 0px var(--border)',
              flexShrink: 0
            }}>
              {needRefresh ? 'i' : '✓'}
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '14px', fontWeight: 800, marginBottom: 4, textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>
                {needRefresh ? 'Update Available' : 'Offline Ready'}
              </h4>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {needRefresh 
                  ? 'A new version of Gurav Online Services is available. Reload to update.' 
                  : 'Gurav Online Services has been cached and is ready to work offline.'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            {needRefresh ? (
              <>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => updateServiceWorker(true)}
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  Reload Now
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setNeedRefresh(false)}
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  Later
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => setOfflineReady(false)}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── CSS for mobile/desktop dropdowns and accordions ── */}
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
          0% {
            transform: translateX(100%);
          }
          30% {
            transform: translateX(0%);
          }
          50% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-100%);
          }
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
