import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import ProtectedRoute from '@/components/Layout/ProtectedRoute';
import Layout from '@/components/Layout/Layout';
import SplashScreen from '@/components/Layout/SplashScreen';
import ErrorBoundary from '@/components/ErrorBoundary';

// Lazy loaded page components
const LoginPage = lazy(() => import('@/pages/Login'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPassword'));
const DashboardPage = lazy(() => import('@/pages/Dashboard'));
const AffidavitsPage = lazy(() => import('@/pages/Affidavits'));
const MarriagesPage = lazy(() => import('@/pages/Marriages'));
const BirthDeathCertificatesPage = lazy(() => import('@/pages/BirthDeathCertificates'));
const PropertyCardsPage = lazy(() => import('@/pages/PropertyCards'));
const ShopActLicensesPage = lazy(() => import('@/pages/ShopActLicenses'));
const RecordsPage = lazy(() => import('@/pages/Records'));
const PaymentsPage = lazy(() => import('@/pages/Payments'));
const UsersPage = lazy(() => import('@/pages/Users'));
const AuditLogsPage = lazy(() => import('@/pages/AuditLogs'));
const SettingsPage = lazy(() => import('@/pages/Settings'));
const CustomersPage = lazy(() => import('@/pages/Customers'));
const TradeLicensesPage = lazy(() => import('@/pages/TradeLicenses'));
const PanCardsPage = lazy(() => import('@/pages/PanCards'));
const PassportsPage = lazy(() => import('@/pages/Passports'));
const VoterCardsPage = lazy(() => import('@/pages/VoterCards'));
const GazettesPage = lazy(() => import('@/pages/Gazettes'));
const WaterSupplyPage = lazy(() => import('@/pages/WaterSupply'));
const PropertyTaxPage = lazy(() => import('@/pages/PropertyTax'));
const PublicReceiptPage = lazy(() => import('@/pages/PublicReceipt'));
const SnoopyPage = lazy(() => import('@/pages/Snoopy'));
const ReferencesPage = lazy(() => import('@/pages/References'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <Suspense fallback={<SplashScreen />}>
              <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/reset-password" element={<ProtectedRoute><ResetPasswordPage /></ProtectedRoute>} />
                  <Route path="/share/receipt" element={<SnoopyPage />} />
                  <Route path="/share/receipt/:type" element={<SnoopyPage />} />
                  <Route path="/share/receipt/:type/:id" element={<PublicReceiptPage />} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Layout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<DashboardPage />} />
                    <Route path="affidavits" element={<AffidavitsPage />} />
                    <Route path="marriages" element={<MarriagesPage />} />
                    <Route path="birth-death" element={<BirthDeathCertificatesPage />} />
                    <Route path="property-cards" element={<PropertyCardsPage />} />
                    <Route path="shop-act" element={<ShopActLicensesPage />} />
                    <Route path="trade-licenses" element={<TradeLicensesPage />} />
                    <Route path="water-supply" element={<WaterSupplyPage />} />
                    <Route path="property-tax" element={<PropertyTaxPage />} />
                    <Route path="pan-cards" element={<PanCardsPage />} />
                    <Route path="passports" element={<PassportsPage />} />
                    <Route path="voter-cards" element={<VoterCardsPage />} />
                    <Route path="gazettes" element={<GazettesPage />} />
                    <Route path="records" element={<RecordsPage />} />
                    <Route path="payments" element={<PaymentsPage />} />
                    <Route path="customers" element={<CustomersPage />} />
                    <Route path="references" element={<ReferencesPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route
                      path="users"
                      element={
                        <ProtectedRoute requireRole="admin">
                          <UsersPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="audit-logs"
                      element={
                        <ProtectedRoute requireRole="admin">
                          <AuditLogsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </Suspense>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
