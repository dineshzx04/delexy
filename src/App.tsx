import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { WorkspaceProvider, useWorkspace } from './contexts/WorkspaceContext';
import { BreadcrumbProvider } from './contexts/BreadcrumbContext';
import ErrorBoundary from './components/ErrorBoundary';
import { seedDatabase } from './data/seed';

import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import PlatformLayout from './layouts/PlatformLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// User & Platform Core Pages
import UserProfile from './pages/user/UserProfile'; 
import Dashboard from './pages/user/Dashboard';
import PlaceholderPage from './pages/user/PlaceholderPage';

// Platform Taxonomy Core Pages
import Attributes from './pages/platform/attributes/Attributes';
import AttributeValues from './pages/platform/attributes/AttributeValues';
import AttributeGroups from './pages/platform/attributes/AttributeGroups';
import AttributeMapping from './pages/platform/attributes/AttributeMapping';
import PlatformDashboard from './pages/platform/PlatformDashboard';

const ActiveLayout: React.FC = () => {
  const { activeWorkspace } = useWorkspace();
  return activeWorkspace?.type === 'platform' ? <PlatformLayout /> : <DashboardLayout />;
};

const App: React.FC = () => {
  useEffect(() => {
    seedDatabase();
  }, []);

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
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile" element={<UserProfile />} /> 
            </Route>
          </Route>

          {/* Authenticated Dashboard Routes (Tenant & Individual) */}
          <Route path="/" element={<DashboardLayout />}>
            <Route element={<ErrorBoundary />}>
              <Route index element={<Navigate to="/dashboard" replace />} />

              <Route path="create-organization" element={<PlaceholderPage />} />
              <Route path="join-organization" element={<PlaceholderPage />} />
              <Route path="user-management" element={<PlaceholderPage />} />
              <Route path="rbac/*" element={<PlaceholderPage />} />

              <Route path="marketplace/*" element={<PlaceholderPage />} />
              <Route path="rfqs/*" element={<PlaceholderPage />} />
              <Route path="products/*" element={<PlaceholderPage />} />
              <Route path="orders/*" element={<PlaceholderPage />} />
              <Route path="suppliers/*" element={<PlaceholderPage />} />
              <Route path="manufacturer/*" element={<PlaceholderPage />} />
            </Route>
          </Route>

          {/* Platform Routes */}
          <Route path="/platform" element={<PlatformLayout />}>
            <Route element={<ErrorBoundary />}>
              <Route index element={<PlatformDashboard />} />
              <Route path="dashboard" element={<PlatformDashboard />} />

              {/* Attributes & Category Mapping Modules */}
              <Route path="attributes" element={<Attributes />} />
              <Route path="attributes/values" element={<AttributeValues />} />
              <Route path="attributes/groups" element={<AttributeGroups />} />
              <Route path="attributes/mapping" element={<AttributeMapping />} />
              <Route path="category/*" element={<PlaceholderPage />} />
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

