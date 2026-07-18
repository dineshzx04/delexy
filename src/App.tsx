import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { WorkspaceProvider, useWorkspace } from './contexts/WorkspaceContext';
import { BreadcrumbProvider } from './contexts/BreadcrumbContext';
import ErrorBoundary from './components/ErrorBoundary';

import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
// Auth Pages


// Dashboard Pages
import UserProfile from './pages/dashboard/UserProfile';
import AccountSettings from './pages/dashboard/AccountSettings';
import SecuritySettings from './pages/dashboard/SecuritySettings';
import ActiveSessions from './pages/dashboard/ActiveSessions';
import Dashboard from './pages/dashboard/Dashboard';
import PlaceholderPage from './pages/dashboard/PlaceholderPage';
import RolesList from './pages/dashboard/rbac/RolesList';
import RoleEditor from './pages/dashboard/rbac/RoleEditor';
import TeamManagement from './pages/dashboard/team/TeamManagement';
import PlatformLayout from './layouts/PlatformLayout';
import PlatformDashboard from './pages/platform/PlatformDashboard';
import PlatformTeam from './pages/platform/PlatformTeam';
import PlatformRolesList from './pages/platform/rbac/PlatformRolesList';
import PlatformRoleEditor from './pages/platform/rbac/PlatformRoleEditor';
import Attributes from './pages/platform/attributes/Attributes';
import AttributeValues from './pages/platform/attributes/AttributeValues';
import AttributeGroups from './pages/platform/attributes/AttributeGroups';
import AttributeMapping from './pages/platform/attributes/AttributeMapping';
import CategoryManagement from './pages/platform/CategoryManagement';
import PlatformProducts from './pages/platform/PlatformProducts';
import PlatformProductReview from './pages/platform/PlatformProductReview';
import PlatformReviewDetail from './pages/platform/PlatformReviewDetail';
import OutboundRFQList from './pages/tenant/rfq/OutboundRFQList';
import InboundRFQList from './pages/tenant/rfq/InboundRFQList';
import InboundRFQDetail from './pages/tenant/rfq/InboundRFQDetail';
import OutboundRFQDetail from './pages/tenant/rfq/OutboundRFQDetail';
import CreateRFQ from './pages/tenant/rfq/CreateRFQ';
import UserProductsList from './pages/tenant/products/UserProductsList';
import ProductBuilder from './pages/tenant/products/ProductBuilder';
import GlobalCatalog from './pages/tenant/catalog/GlobalCatalog';
import CreateOrganization from './pages/auth/CreateOrganization';
import EmailVerification from './pages/auth/EmailVerification';
import ForgotPassword from './pages/auth/ForgotPassword';
import JoinOrganization from './pages/auth/JoinOrganization';
import LandingPage from './pages/auth/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ResetPassword from './pages/auth/ResetPassword';
import TwoFactorAuth from './pages/auth/TwoFactorAuth';

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
              <Route path="/login" element={<Login />} />
              <Route path="/2fa" element={<TwoFactorAuth />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<EmailVerification />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>
          </Route>

          {/* Common Pages (Dynamic Layout based on Active Workspace) */}
          <Route element={<ActiveLayout />}>
            <Route element={<ErrorBoundary />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile" element={<UserProfile />} />
              <Route path="settings" element={<Navigate to="/settings/account" replace />} />
              <Route path="settings/account" element={<AccountSettings />} />
              <Route path="settings/security" element={<SecuritySettings />} />
              <Route path="settings/sessions" element={<ActiveSessions />} />
            </Route>
          </Route>

          {/* Authenticated Dashboard Routes (Tenant & Individual) */}
          <Route path="/" element={<DashboardLayout />}>
            <Route element={<ErrorBoundary />}>
              <Route index element={<Navigate to="/dashboard" replace />} />

              <Route path="create-organization" element={<CreateOrganization />} />
              <Route path="join-organization" element={<JoinOrganization />} />

              {/* Tenant Specific Routes */}
              <Route path="user-management" element={<TeamManagement />} />
              <Route path="rbac" element={<Navigate to="/rbac/roles" replace />} />
              <Route path="rbac/roles" element={<RolesList />} />
              <Route path="rbac/roles/new" element={<RoleEditor />} />
              <Route path="rbac/roles/:id" element={<RoleEditor />} />

              {/* Tenant & Individual Specific Routes */}
              <Route path="marketplace/catalog" element={<GlobalCatalog />} />
              <Route path="rfqs/outbound" element={<OutboundRFQList />} />
              <Route path="rfqs/inbound" element={<InboundRFQList />} />
              <Route path="rfqs/new" element={<CreateRFQ />} />
              <Route path="rfqs/inbound/:id" element={<InboundRFQDetail />} />
              <Route path="rfqs/outbound/:id" element={<OutboundRFQDetail />} />
              <Route path="products" element={<UserProductsList />} />
              <Route path="products/new" element={<ProductBuilder />} />
              <Route path="products/:id/edit" element={<ProductBuilder />} />
              <Route path="orders" element={<PlaceholderPage />} />
              <Route path="suppliers" element={<PlaceholderPage />} />
              <Route path="manufacturer" element={<PlaceholderPage />} />
            </Route>
          </Route>

          {/* Platform Routes */}
          <Route path="/platform" element={<PlatformLayout />}>
            <Route element={<ErrorBoundary />}>
              <Route index element={<PlatformDashboard />} />
              <Route path="dashboard" element={<PlatformDashboard />} />

              <Route path="members" element={<PlatformTeam />} />
              <Route path="rbac/roles" element={<PlatformRolesList />} />
              <Route path="rbac/roles/new" element={<PlatformRoleEditor />} />
              <Route path="rbac/roles/:id" element={<PlatformRoleEditor />} />
              <Route path="rbac" element={<Navigate to="/platform/rbac/roles" replace />} />

              <Route path="attributes" element={<Attributes />} />
              <Route path="attributes/values" element={<AttributeValues />} />
              <Route path="attributes/groups" element={<AttributeGroups />} />
              <Route path="attributes/mapping" element={<AttributeMapping />} />

              <Route path="category" element={<CategoryManagement />} />
              <Route path="platform-products" element={<PlatformProducts />} />
              <Route path="user-products" element={<PlatformProductReview />} />
              <Route path="review/:id" element={<PlatformReviewDetail />} />

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
