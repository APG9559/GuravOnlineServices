import { useAuth } from '@/context/AuthContext';
import {
  ProfileIcon,
  ExpensesIcon,
  MessageIcon,
  LogsIcon,
  EditIcon,
  LogoutIcon,
  ChevronDownIcon,
} from './icons';

interface UserDropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileOpen: () => void;
  onExpensesOpen: () => void;
  onNavigate: (to: string) => void;
}

export default function UserDropdown({
  open,
  onOpenChange,
  onProfileOpen,
  onExpensesOpen,
  onNavigate,
}: UserDropdownProps) {
  const { user, logout, isAdmin } = useAuth();
  const handleLogout = () => {
    logout();
    onNavigate('/login');
  };

  return (
    <div
      style={{
        marginLeft: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        borderLeft: '2.5px solid var(--border)',
        paddingLeft: 14,
        position: 'relative',
      }}
    >
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
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
        <div
          style={{
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
          }}
        >
          {user?.name ? user.name[0].toUpperCase() : 'U'}
        </div>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {user?.name}
          <ChevronDownIcon open={open} />
        </span>
      </button>

      {open && (
        <>
          <div
            onClick={() => onOpenChange(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 90 }}
          />
          <div
            style={{
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
            }}
          >
            <DropdownButton
              onClick={() => {
                onOpenChange(false);
                onProfileOpen();
              }}
            >
              <ProfileIcon /> My Profile
            </DropdownButton>
            <DropdownButton
              onClick={() => {
                onOpenChange(false);
                onExpensesOpen();
              }}
            >
              <ExpensesIcon /> My Expenses
            </DropdownButton>
            <DropdownButton
              onClick={() => {
                onOpenChange(false);
                onNavigate('/message-templates');
              }}
            >
              <MessageIcon /> Msg Templates
            </DropdownButton>
            <DropdownButton
              onClick={() => {
                onOpenChange(false);
                onNavigate('/message-logs');
              }}
            >
              <LogsIcon /> Msg Logs
            </DropdownButton>
            {isAdmin && (
              <DropdownButton
                onClick={() => {
                  onOpenChange(false);
                  onNavigate('/audit-logs');
                }}
              >
                <EditIcon /> Audit Logs
              </DropdownButton>
            )}
            <DropdownButton
              onClick={() => {
                onOpenChange(false);
                handleLogout();
              }}
              danger
            >
              <LogoutIcon /> Sign out
            </DropdownButton>
          </div>
        </>
      )}
    </div>
  );
}

function DropdownButton({
  onClick,
  danger,
  children,
}: {
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '10px 16px',
        fontSize: '13px',
        fontWeight: 700,
        color: danger ? 'var(--danger)' : 'var(--text)',
        background: 'transparent',
        border: 'none',
        borderBottom: '1px solid var(--border-light)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {children}
    </button>
  );
}
