import { useState, useEffect, useRef, Suspense } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import ExpensesModal from '@/components/ExpensesModal';

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
          background: '#ffffff',
          border: '3px solid #000000',
          borderRadius: '8px',
          boxShadow: '4px 4px 0px #000000',
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
                color: '#000000',
                textDecoration: 'none',
                background: isActive ? 'var(--accent-light)' : 'transparent',
                borderBottom: '1px solid #eee',
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
    <div style={{ borderBottom: '2.5px solid #000000' }}>
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
          color: '#000000',
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
        <div style={{ background: '#fafafa', borderTop: '2.5px solid #000000' }}>
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
                color: '#000000',
                textDecoration: 'none',
                background: isActive ? 'var(--accent-light)' : 'transparent',
                borderBottom: '1px solid #ddd',
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
          background: '#ffffff',
          border: '3px solid #000000',
          borderRadius: '12px',
          boxShadow: '4px 4px 0px #000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'logo-pulse 1.5s infinite ease-in-out',
        }}
      >
        <img src="/G.png" style={{ width: '80%', height: '80%', objectFit: 'contain' }} alt="Loading..." />
      </div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: '#000000', fontFamily: "'Space Grotesk', sans-serif" }}>Loading page...</div>
    </div>
  );
}

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showExpenses, setShowExpenses] = useState(false);
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
              border: '4px solid #000000',
              borderRadius: '20px',
              boxShadow: '6px 6px 0px #000000',
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
        background: '#ffffff',
        borderBottom: '3px solid #000000',
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
            border: '2px solid #000000',
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
            borderLeft: '2.5px solid #000000',
            paddingLeft: 14,
            position: 'relative',
          }}>
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
                color: 'var(--accent-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 12,
                border: '2px solid #000000',
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
                  background: '#ffffff',
                  border: '3px solid #000000',
                  borderRadius: '8px',
                  boxShadow: '4px 4px 0px #000000',
                  padding: '6px 0',
                  minWidth: 150,
                  zIndex: 100,
                  marginTop: 8,
                }}>
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
                      color: '#000000',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid #eee',
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
                color: isActive ? 'var(--accent-text)' : 'var(--text-muted)',
                borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                borderBottom: '2.5px solid #000000',
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
                  color: isActive ? 'var(--accent-text)' : 'var(--text-muted)',
                  borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                  borderBottom: '2.5px solid #000000',
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
                color: 'var(--accent-text)',
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

      <main style={{ padding: '1.5rem', flex: 1, maxWidth: 1200, width: '100%', margin: '0 auto' }}>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>

      {showExpenses && user && (
        <ExpensesModal user={user} onClose={() => setShowExpenses(false)} />
      )}

      {/* ── CSS for mobile/desktop dropdowns and accordions ── */}
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
        .dropdown-item {
          display: block;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 700;
          color: #000000;
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
      `}</style>
    </div>
  );
}
