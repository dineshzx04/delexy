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
import UserBrands from './pages/user/UserBrands';
import CreateBusiness from './pages/user/CreateBusiness';

import BusinessDashboard from './pages/business/BusinessDashboard';
import BusinessMembers from './pages/business/BusinessMembers';
import BusinessRoles from './pages/business/BusinessRoles';
import BusinessEmailsPage from './pages/business/BusinessEmailsPage';
import BusinessSettings from './pages/business/BusinessSettings';
import BusinessRFQs from './pages/business/BusinessRFQs';
import BusinessProducts from './pages/business/BusinessProducts';
import BusinessProfile from './pages/business/BusinessProfile';
import BusinessBrands from './pages/business/BusinessBrands';
import IndexedDbManager from './pages/dev/IndexedDbManager';
import PlatformLayout from './layouts/PlatformLayout';
import PlatformDashboard from './pages/platform/PlatformDashboard';
import AttributeValues from './pages/platform/AttributeValues';
import Attributes from './pages/platform/Attributes';
import AttributeGroups from './pages/platform/AttributeGroups';
import AttributeMapping from './pages/platform/AttributeMapping';
import CategoryManagement from './pages/platform/CategoryManagement';
import CategoryProducts from './pages/platform/CategoryProducts';
import PlatformUsers from './pages/platform/PlatformUsers';
import PlatformUserRegistry from './pages/platform/PlatformUserRegistry';
import PlatformBusinesses from './pages/platform/PlatformBusinesses';
import PlatformBrands from './pages/platform/PlatformBrands';
import PlatformParties from './pages/platform/PlatformParties';
import PlatformManufacturers from './pages/platform/PlatformManufacturers';
import PlatformRoles from './pages/platform/PlatformRoles';
import PlatformSellerProducts from './pages/platform/PlatformSellerProducts';

import NotFound from './pages/common/NotFound';

const RootRedirect: React.FC = () => {
  const { activeWorkspace, currentCredential } = useWorkspace();
  if (activeWorkspace?.type === 'PLATFORM') {
    return <Navigate to="/p/dashboard" replace />;
  }
  if (currentCredential?.credential_type === 'BUSINESS' || activeWorkspace?.type === 'BUSINESS') {
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
                <Route path="brands" element={<UserBrands />} />
                <Route path="create-business" element={<CreateBusiness />} />
                <Route path="*" element={<NotFound scope="user" />} />
              </Route>
            </Route>

            {/* Business Workspace Routes (/b/dashboard, /b/members, etc.) */}
            <Route path="/b" element={<BusinessLayout />}>
              <Route element={<ErrorBoundary />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<BusinessDashboard />} />
                <Route path="profile" element={<BusinessProfile />} />
                <Route path="brands" element={<BusinessBrands />} />
                <Route path="members" element={<BusinessMembers />} />
                <Route path="roles" element={<BusinessRoles />} />
                <Route path="emails" element={<BusinessEmailsPage />} />
                <Route path="settings" element={<BusinessSettings />} />
                <Route path="rfqs" element={<BusinessRFQs />} />
                <Route path="products" element={<BusinessProducts />} />
                <Route path="*" element={<NotFound scope="business" />} />
              </Route>
            </Route>

            {/* Platform Admin Workspace Routes (/p/dashboard, etc.) */}
            <Route path="/p" element={<PlatformLayout />}>
              <Route element={<ErrorBoundary />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<PlatformDashboard />} />
                <Route path="attributes" element={<Attributes />} />
                <Route path="attribute-values" element={<AttributeValues />} />
                <Route path="attribute-groups" element={<AttributeGroups />} />
                <Route path="attribute-mapping" element={<AttributeMapping />} />
                <Route path="categories" element={<CategoryManagement />} />
                <Route path="products" element={<CategoryProducts />} />
                <Route path="seller-products" element={<PlatformSellerProducts />} />
                <Route path="users" element={<PlatformUsers />} />
                <Route path="user-registry" element={<PlatformUserRegistry />} />
                <Route path="businesses" element={<PlatformBusinesses />} />
                <Route path="parties" element={<PlatformParties />} />
                <Route path="manufacturers" element={<PlatformManufacturers />} />
                <Route path="brands" element={<PlatformBrands />} />
                <Route path="platform-roles" element={<PlatformRoles />} />
                <Route path="*" element={<NotFound scope="platform" />} />
              </Route>
            </Route>

            {/* Backward Compatibility Redirects */}
            <Route path="/platform/*" element={<Navigate to="/p/dashboard" replace />} />
            <Route path="/admin/*" element={<Navigate to="/p/dashboard" replace />} />
            <Route path="/business/*" element={<Navigate to="/b/dashboard" replace />} />

            {/* Legacy route redirects */}
            <Route path="/dashboard" element={<RootRedirect />} />
            <Route path="/profile" element={<RootRedirect />} />

            {/* Protected Root Redirect & Global 404 Fallback */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<NotFound scope="global" />} />
          </Route>
        </Routes>
      </BreadcrumbProvider>
    </WorkspaceProvider>
  );
};

export default App;
