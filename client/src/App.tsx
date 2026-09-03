import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { SettingsPage } from './pages/SettingsPage';
import { CustomersPage } from './pages/CustomersPage';
import { ProductsPage } from './pages/ProductsPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { InvoiceCreateEditPage } from './pages/InvoiceCreateEditPage';
import { InvoiceDetailPage } from './pages/InvoiceDetailPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { ReportsPage } from './pages/ReportsPage';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Guest / Public Routes */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Authenticated Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                
                {/* Customer Routes */}
                <Route path="/customers" element={<CustomersPage />} />

                {/* Product Routes */}
                <Route path="/products" element={<ProductsPage />} />

                {/* Invoice Routes */}
                <Route path="/invoices" element={<InvoicesPage />} />
                <Route path="/invoices/new" element={<InvoiceCreateEditPage />} />
                <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
                <Route path="/invoices/:id/edit" element={<InvoiceCreateEditPage />} />

                {/* Expenses Routes */}
                <Route path="/expenses" element={<ExpensesPage />} />

                {/* Reports Routes */}
                <Route path="/reports" element={<ReportsPage />} />

                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
