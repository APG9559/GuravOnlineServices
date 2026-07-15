import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { MobileAccordion } from './Dropdowns';
import { DashboardIcon, MessageIcon, LogsIcon, EditIcon } from './icons';
import { dashboardLink, serviceGroups, bottomNavLinks, getAdminLinks } from './navData';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (to: string) => void;
  onProfileOpen: () => void;
  onExpensesOpen: () => void;
  onLogout: () => void;
}

const linkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
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
});

const preventDefault = (e: React.MouseEvent, fn: () => void) => {
  if (e.button === 0 && !e.metaKey && !e.altKey && !e.ctrlKey && !e.shiftKey) {
    e.preventDefault();
    fn();
  }
};

export default function MobileMenu({
  open,
  onClose,
  onNavigate,
  onProfileOpen,
  onExpensesOpen,
  onLogout,
}: MobileMenuProps) {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  // Close menu on route change
  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  if (!open) return null;

  return (
    <div
      className="mobile-menu"
      style={{
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
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '8px 0',
          flex: 1,
        }}
      >
        <NavLink
          to={dashboardLink.to}
          end={dashboardLink.end}
          onClick={(e) =>
            preventDefault(e, () => {
              onClose();
              onNavigate(dashboardLink.to);
            })
          }
          className="nav-item"
          style={linkStyle}
        >
          <DashboardIcon />
          <span>{dashboardLink.label}</span>
        </NavLink>

        {serviceGroups.map((group) => (
          <MobileAccordion
            key={group.label}
            group={group}
            onCloseMenu={onClose}
            onNavigate={onNavigate}
          />
        ))}

        {bottomNavLinks.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={(e) =>
              preventDefault(e, () => {
                onClose();
                onNavigate(to);
              })
            }
            className="nav-item"
            style={linkStyle}
          >
            {icon}
            <span>{label}</span>
          </NavLink>
        ))}

        <NavLink
          to="/message-templates"
          onClick={(e) =>
            preventDefault(e, () => {
              onClose();
              onNavigate('/message-templates');
            })
          }
          className="nav-item"
          style={linkStyle}
        >
          <MessageIcon />
          <span>Msg Templates</span>
        </NavLink>

        <NavLink
          to="/message-logs"
          onClick={(e) =>
            preventDefault(e, () => {
              onClose();
              onNavigate('/message-logs');
            })
          }
          className="nav-item"
          style={linkStyle}
        >
          <LogsIcon />
          <span>Msg Logs</span>
        </NavLink>

        {isAdmin && (
          <NavLink
            to="/audit-logs"
            onClick={(e) =>
              preventDefault(e, () => {
                onClose();
                onNavigate('/audit-logs');
              })
            }
            className="nav-item"
            style={linkStyle}
          >
            <EditIcon />
            <span>Audit Logs</span>
          </NavLink>
        )}

        {getAdminLinks().map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={(e) =>
              preventDefault(e, () => {
                onClose();
                onNavigate(to);
              })
            }
            className="nav-item"
            style={linkStyle}
          >
            {icon}
            <span>{label}</span>
          </NavLink>
        ))}
      </div>

      {/* User info + sign out at bottom */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '0.5px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'var(--accent-light)',
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: 13,
              overflow: 'hidden',
              border: '1px solid #cbd5e1',
            }}
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="Avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              user?.name ? user.name[0].toUpperCase() : 'U'
            )}
          </div>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>
            {user?.name}
            <span
              className={`badge ${user?.role === 'admin' ? 'badge-amber' : 'badge-blue'}`}
              style={{ marginLeft: 8 }}
            >
              {user?.role}
            </span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              onClose();
              onProfileOpen();
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, fontSize: 12 }}
          >
            Profile
          </button>
          <button
            type="button"
            className="btn btn-sm btn-success-soft"
            onClick={() => {
              onClose();
              onExpensesOpen();
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
          <button
            className="btn btn-sm btn-danger-soft"
            onClick={onLogout}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
