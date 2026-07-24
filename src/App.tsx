import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { WorkspaceProvider, useWorkspace } from './contexts/WorkspaceContext';
import { BreadcrumbProvider } from './contexts/BreadcrumbContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';

import AuthLayout from './layouts/AuthLayout';
import UserLayout from './layouts/UserLayout';
import BusinessLayout from './layouts/BusinessLayout';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import LandingPage from './pages/auth/LandingPage';

import Dashboard from './pages/user/Dashboard';
import UserProfile from './pages/user/UserProfile';
import UserAddresses from './pages/user/UserAddresses';
import UserIdentifications from './pages/user/UserIdentifications';
import CreateBusiness from './pages/user/CreateBusiness';

import BusinessDashboard from './pages/business/BusinessDashboard';
import BusinessMembers from './pages/business/BusinessMembers';
import BusinessRoles from './pages/business/BusinessRoles';
import BusinessEmailsPage from './pages/business/BusinessEmailsPage';
import BusinessSettings from './pages/business/BusinessSettings';
import BusinessRFQs from './pages/business/BusinessRFQs';
import BusinessProducts from './pages/business/BusinessProducts';
import IndexedDbManager from './pages/dev/IndexedDbManager';

const RootRedirect: React.FC = () => {
  const { activeWorkspace, currentCredential } = useWorkspace();
  if (currentCredential?.credential_type === 'BUSINESS' || activeWorkspace?.type === 'tenant') {
    return <Navigate to="/b/dashboard" replace />;
  }
  return <Navigate to="/user/dashboard" replace />;
};

const PublicAuthGuard: React.FC = () => {
  const { isAuthenticated, isLoading } = useWorkspace();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spin size="large" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <RootRedirect />;
  }
  return <AuthLayout />;
};

const App: React.FC = () => {
  return (
    <WorkspaceProvider>
      <BreadcrumbProvider>
        <Routes>
          {/* Public & Landing Routes */}
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/db" element={<IndexedDbManager />} />

          {/* Public Auth Routes */}
          <Route element={<PublicAuthGuard />}>
            <Route element={<ErrorBoundary />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
          </Route>

          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute />}>
            {/* User Workspace Routes */}
            <Route path="/user" element={<UserLayout />}>
              <Route element={<ErrorBoundary />}>
                <Route index element={<Navigate to="/user/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="profile" element={<UserProfile />} />
                <Route path="addresses" element={<UserAddresses />} />
                <Route path="identifications" element={<UserIdentifications />} />
                <Route path="create-business" element={<CreateBusiness />} />
              </Route>
            </Route>

            {/* Business Workspace Routes (/b/dashboard, /b/members, etc.) */}
            <Route path="/b" element={<BusinessLayout />}>
              <Route element={<ErrorBoundary />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<BusinessDashboard />} />
                <Route path="members" element={<BusinessMembers />} />
                <Route path="roles" element={<BusinessRoles />} />
                <Route path="emails" element={<BusinessEmailsPage />} />
                <Route path="settings" element={<BusinessSettings />} />
                <Route path="rfqs" element={<BusinessRFQs />} />
                <Route path="products" element={<BusinessProducts />} />
              </Route>
            </Route>

            {/* Backward Compatibility Redirects for legacy parameter routes */}
            <Route path="/b/:businessId/*" element={<Navigate to="/b/dashboard" replace />} />
            <Route path="/business/*" element={<Navigate to="/b/dashboard" replace />} />

            {/* Legacy route redirects */}
            <Route path="/dashboard" element={<RootRedirect />} />
            <Route path="/profile" element={<RootRedirect />} />

            {/* Protected Root Redirect */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<RootRedirect />} />
          </Route>
        </Routes>
      </BreadcrumbProvider>
    </WorkspaceProvider>
  );
};

export default App;
