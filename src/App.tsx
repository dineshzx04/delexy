import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { WorkspaceProvider, useWorkspace } from './contexts/WorkspaceContext';
import { BreadcrumbProvider } from './contexts/BreadcrumbContext';
import ErrorBoundary from './components/ErrorBoundary';
import { seedDatabase } from './data/seed';

import AuthLayout from './layouts/AuthLayout';
import UserLayout from './layouts/UserLayout';
import PlatformLayout from './layouts/PlatformLayout';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import UserProfile from './pages/user/UserProfile';
import Dashboard from './pages/user/Dashboard';
import PlaceholderPage from './pages/user/PlaceholderPage';

import PlatformDashboard from './pages/platform/PlatformDashboard';

const ActiveLayout: React.FC = () => {
  const { activeWorkspace } = useWorkspace();
  return activeWorkspace?.type === 'platform' ? <PlatformLayout /> : <UserLayout />;
};
const Fallback: React.FC = () => {
  const { activeWorkspace } = useWorkspace();
  return activeWorkspace?.type === 'platform' ? <Navigate to={"/platform"} replace /> : <Navigate to={"/dashboard"} replace />;
};

const App: React.FC = () => {
  return (
    <WorkspaceProvider>
      <BreadcrumbProvider>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/landing" element={
            <ErrorBoundary>
              <PlaceholderPage />
            </ErrorBoundary>
          } />

          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route element={<ErrorBoundary />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
          </Route>

          {/* Common Core Pages (Dynamic Layout) */}
          <Route element={<ActiveLayout />}>
            <Route element={<ErrorBoundary />}>
              <Route path="profile" element={<UserProfile />} />
            </Route>
          </Route>

          {/* Authenticated Dashboard Routes (Tenant & Individual) */}
          <Route path="/" element={<UserLayout />}>
            <Route element={<ErrorBoundary />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
            </Route>
          </Route>

          {/* Platform Routes */}
          <Route path="/platform" element={<PlatformLayout />}>
            <Route element={<ErrorBoundary />}>
              <Route index element={<PlatformDashboard />} />
              <Route path="dashboard" element={<PlatformDashboard />} />

            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Fallback />} />
        </Routes>
      </BreadcrumbProvider>
    </WorkspaceProvider>
  );
};

export default App;

