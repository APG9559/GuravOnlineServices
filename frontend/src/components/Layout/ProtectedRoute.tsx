import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types';

interface Props {
  children: React.ReactNode;
  requireRole?: Role;
}

export default function ProtectedRoute({ children, requireRole }: Props) {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireRole && user.role !== requireRole) return <Navigate to="/" replace />;

  return <>{children}</>;
}
