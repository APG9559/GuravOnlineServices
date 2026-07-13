import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import Router from '@/router';
import AppOpeningTransition from '@/components/Layout/AppOpeningTransition';
import ErrorBoundary from '@/components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  const [showOpening, setShowOpening] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (window.location.pathname.startsWith('/share/receipt')) return false;
    const isReload =
      (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type === 'reload' ||
      (typeof performance.navigation !== 'undefined' && performance.navigation.type === 1);
    const hasOpened = sessionStorage.getItem('app_opened') === 'true';
    return !isReload && !hasOpened;
  });

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            {showOpening && (
              <AppOpeningTransition
                onComplete={() => {
                  sessionStorage.setItem('app_opened', 'true');
                  setShowOpening(false);
                }}
              />
            )}
            <Router />
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
