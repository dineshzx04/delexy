import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { BreadcrumbProvider } from './contexts/BreadcrumbContext';
import ErrorBoundary from './components/ErrorBoundary';

// Auth Pages
import LandingPage from './pages/auth/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import EmailVerification from './pages/auth/EmailVerification';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import TwoFactorAuth from './pages/auth/TwoFactorAuth';
import CreateOrganization from './pages/auth/CreateOrganization';
import JoinOrganization from './pages/auth/JoinOrganization';

// Dashboard Pages
import UserProfile from './pages/dashboard/UserProfile';
import AccountSettings from './pages/dashboard/AccountSettings';
import SecuritySettings from './pages/dashboard/SecuritySettings';
import ActiveSessions from './pages/dashboard/ActiveSessions';
import Dashboard from './pages/dashboard/Dashboard';
import PlaceholderPage from './pages/dashboard/PlaceholderPage';
import PlatformLayout from './layouts/PlatformLayout';
import { useWorkspace } from './contexts/WorkspaceContext';

const ActiveLayout: React.FC = () => {
  const { activeWorkspace } = useWorkspace();
  return activeWorkspace?.type === 'platform' ? <PlatformLayout /> : <DashboardLayout />;
};

const App: React.FC = () => {
  return (
    <WorkspaceProvider>
      <BreadcrumbProvider>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/landing" element={
            <ErrorBoundary>
              <LandingPage />
            </ErrorBoundary>
          } />

          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route element={<ErrorBoundary />}>
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/register" element={<Register />} />
              <Route path="/auth/verify-email" element={<EmailVerification />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
              <Route path="/auth/2fa" element={<TwoFactorAuth />} />
              <Route path="/auth/create-organization" element={<CreateOrganization />} />
              <Route path="/auth/join-organization" element={<JoinOrganization />} />
            </Route>
          </Route>

          {/* Common Pages (Dynamic Layout based on Active Workspace) */}
          <Route element={<ActiveLayout />}>
            <Route element={<ErrorBoundary />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile" element={<UserProfile />} />
              <Route path="settings/account" element={<AccountSettings />} />
              <Route path="settings/security" element={<SecuritySettings />} />
              <Route path="settings/sessions" element={<ActiveSessions />} />
            </Route>
          </Route>

          {/* Authenticated Dashboard Routes (Tenant & Individual) */}
          <Route path="/" element={<DashboardLayout />}>
            <Route element={<ErrorBoundary />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              
              {/* Tenant & Individual Specific Routes */}
              <Route path="rfqs" element={<PlaceholderPage />} />
              <Route path="products" element={<PlaceholderPage />} />
              <Route path="orders" element={<PlaceholderPage />} />
              <Route path="suppliers" element={<PlaceholderPage />} />
              <Route path="manufacturer" element={<PlaceholderPage />} />
              
              {/* Tenant Specific Placeholder Routes */}
              <Route path="user-management" element={<PlaceholderPage />} />
              <Route path="rbac" element={<PlaceholderPage />} />
            </Route>
          </Route>

          {/* Platform Routes */}
          <Route path="/platform" element={<PlatformLayout />}>
            <Route element={<ErrorBoundary />}>
              <Route index element={<Dashboard />} />
              <Route path="attribute-values" element={<PlaceholderPage />} />
              <Route path="attributes" element={<PlaceholderPage />} />
              <Route path="groups" element={<PlaceholderPage />} />
              <Route path="category" element={<PlaceholderPage />} />
              <Route path="platform-products" element={<PlaceholderPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BreadcrumbProvider>
    </WorkspaceProvider>
  );
};

export default App;
