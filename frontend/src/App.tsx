import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/components/Layout/ProtectedRoute';
import Layout from '@/components/Layout/Layout';
import LoginPage from '@/pages/Login';
import DashboardPage from '@/pages/Dashboard';
import AffidavitsPage from '@/pages/Affidavits';
import MarriagesPage from '@/pages/Marriages';
import BirthDeathCertificatesPage from '@/pages/BirthDeathCertificates';
import PropertyCardsPage from '@/pages/PropertyCards';
import ShopActLicensesPage from '@/pages/ShopActLicenses';
import RecordsPage from '@/pages/Records';
import UsersPage from '@/pages/Users';
import SettingsPage from '@/pages/Settings';
import CustomersPage from '@/pages/Customers';
import TradeLicensesPage from '@/pages/TradeLicenses';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
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
              <Route path="records" element={<RecordsPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route
                path="users"
                element={
                  <ProtectedRoute requireRole="admin">
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
