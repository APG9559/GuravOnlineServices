import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

export interface ServiceItem {
  to: string;
  label: string;
}

export interface ServiceGroup {
  label: string;
  items: ServiceItem[];
  activePaths: string[];
}

export function DesktopDropdown({
  group,
  onNavigate,
}: {
  group: ServiceGroup;
  onNavigate: (to: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isActive = group.activePaths.includes(location.pathname);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        <span
          style={{
            fontSize: 9,
            marginLeft: 6,
            display: 'inline-block',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.1s',
          }}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div
          style={{
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
          }}
        >
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

export function MobileAccordion({
  group,
  onCloseMenu,
  onNavigate,
}: {
  group: ServiceGroup;
  onCloseMenu: () => void;
  onNavigate: (to: string) => void;
}) {
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
        <div
          style={{
            background: 'var(--bg)',
            borderTop: '2.5px solid var(--border)',
          }}
        >
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
