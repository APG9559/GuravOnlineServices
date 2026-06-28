import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser } from '@/types';
import { authApi } from '@/api';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  updateUser: (updated: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
    }, 1200);
  }, []);

  useEffect(() => {
    let authFinished = false;
    let timerFinished = false;
    let resolvedUser: AuthUser | null = null;
    let tokenRemoved = false;

    const checkFinished = () => {
      if (authFinished && timerFinished) {
        if (tokenRemoved) {
          localStorage.removeItem('token');
        }
        setUser(resolvedUser);
        setLoading(false);
      }
    };

    // 1. Minimum 1.5 second splash timer
    const timer = setTimeout(() => {
      timerFinished = true;
      checkFinished();
    }, 1500);

    // 2. Perform the actual auth check
    const token = localStorage.getItem('token');
    if (!token) {
      authFinished = true;
      checkFinished();
    } else {
      authApi.me()
        .then((res) => {
          resolvedUser = res.data;
        })
        .catch(() => {
          tokenRemoved = true;
        })
        .finally(() => {
          authFinished = true;
          checkFinished();
        });
    }

    return () => clearTimeout(timer);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setLoading(true);
    localStorage.setItem('token', res.data.accessToken);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setUser(res.data.user);
    setLoading(false);
  };

  const updateUser = useCallback((updated: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...updated } : null));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin: user?.role === 'admin', updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
