import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types';
import SplashScreen from './SplashScreen';

interface Props {
  children: React.ReactNode;
  requireRole?: Role;
}

export default function ProtectedRoute({ children, requireRole }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <SplashScreen />;
  if (!user) return <Navigate to="/login" replace />;

  // Force first-time operator login to reset password
  const isOperator = user.role === 'operator';
  if (isOperator && user.isFirstLogin && location.pathname !== '/reset-password') {
    return <Navigate to="/reset-password" replace />;
  }

  // Prevent accessing reset-password if password has already been changed
  if (!(isOperator && user.isFirstLogin) && location.pathname === '/reset-password') {
    return <Navigate to="/" replace />;
  }

  if (requireRole && user.role !== requireRole) return <Navigate to="/" replace />;

  return <>{children}</>;
}
