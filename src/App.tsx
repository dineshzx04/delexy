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
import UserBusinessSubmissions from './pages/user/UserBusinessSubmissions';
import UserSellerProducts from './pages/user/UserSellerProducts';
import SellerProductSubmissionForm from './pages/user/SellerProductSubmissionForm';

import BusinessDashboard from './pages/business/BusinessDashboard';
import BusinessMembers from './pages/business/BusinessMembers';
import BusinessRoles from './pages/business/BusinessRoles';
import BusinessEmailsPage from './pages/business/BusinessEmailsPage';
import BusinessSettings from './pages/business/BusinessSettings';
import BusinessProfile from './pages/business/BusinessProfile';
import BusinessPartyManufacturerBrands from './pages/business/BusinessPartyManufacturerBrands';

// Enterprise Sourcing RFQ Pages
import { BuyerDashboard } from './pages/rfq/BuyerDashboard';
import { RfqList } from './pages/rfq/RfqList';
import { RfqCreateWizard } from './pages/rfq/RfqCreateWizard';
import { RfqWorkspace } from './pages/rfq/RfqWorkspace';
import { ItemDetailWorkspace } from './pages/rfq/ItemDetailWorkspace';
import { SupplierRfqInbox } from './pages/rfq/SupplierRfqInbox';
import { SupplierItemRespond } from './pages/rfq/SupplierItemRespond';

import { RequesterQuoteReview } from './pages/rfq/RequesterQuoteReview';

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
import PlatformSellerProductReviewQueue from './pages/platform/PlatformSellerProductReviewQueue';
import PlatformSellerProductReviewDetail from './pages/platform/PlatformSellerProductReviewDetail';
import PlatformBusinessReviewQueue from './pages/platform/PlatformBusinessReviewQueue';
import PlatformBusinessReviewDetail from './pages/platform/PlatformBusinessReviewDetail';

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
                <Route path="seller-products" element={<UserSellerProducts />} />
                <Route path="seller-products/create" element={<SellerProductSubmissionForm />} />
                <Route path="seller-products/edit/:id" element={<SellerProductSubmissionForm />} />
                <Route path="business-submissions" element={<UserBusinessSubmissions />} />
                <Route path="business-submissions/new" element={<CreateBusiness />} />
                <Route path="business-submissions/edit/:id" element={<CreateBusiness />} />

                {/* User RFQ Sourcing Routes */}
                <Route path="rfqs/dashboard" element={<BuyerDashboard />} />
                <Route path="rfqs" element={<RfqList />} />
                <Route path="rfqs/create" element={<RfqCreateWizard />} />
                <Route path="rfqs/:rfqId" element={<RfqWorkspace />} />
                <Route path="rfqs/:rfqId/items/:itemId" element={<ItemDetailWorkspace />} />
                <Route path="rfqs/:rfqId/items/:itemId/quotes/:quoteId/review" element={<RequesterQuoteReview />} />
                <Route path="seller/rfqs" element={<SupplierRfqInbox />} />
                <Route path="seller/rfqs/:rfqId/items/:itemId/respond" element={<SupplierItemRespond />} />
                <Route path="*" element={<NotFound scope="user" />} />
              </Route>
            </Route>

            {/* Business Workspace Routes (/b/dashboard, /b/members, etc.) */}
            <Route path="/b" element={<BusinessLayout />}>
              <Route element={<ErrorBoundary />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<BusinessDashboard />} />
                <Route path="profile" element={<BusinessProfile />} />
                <Route path="party-brands" element={<BusinessPartyManufacturerBrands />} />
                <Route path="members" element={<BusinessMembers />} />
                <Route path="roles" element={<BusinessRoles />} />
                <Route path="emails" element={<BusinessEmailsPage />} />
                <Route path="settings" element={<BusinessSettings />} />
                <Route path="products" element={<UserSellerProducts />} />
                <Route path="products/create" element={<SellerProductSubmissionForm />} />
                <Route path="products/edit/:id" element={<SellerProductSubmissionForm />} />

                {/* Business RFQ Sourcing Routes */}
                <Route path="rfqs/dashboard" element={<BuyerDashboard />} />
                <Route path="rfqs" element={<RfqList />} />
                <Route path="rfqs/create" element={<RfqCreateWizard />} />
                <Route path="rfqs/:rfqId" element={<RfqWorkspace />} />
                <Route path="rfqs/:rfqId/items/:itemId" element={<ItemDetailWorkspace />} />
                <Route path="rfqs/:rfqId/items/:itemId/quotes/:quoteId/review" element={<RequesterQuoteReview />} />
                <Route path="seller/rfqs" element={<SupplierRfqInbox />} />
                <Route path="seller/rfqs/:rfqId/items/:itemId/respond" element={<SupplierItemRespond />} />

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
                <Route path="seller-product-reviews" element={<PlatformSellerProductReviewQueue />} />
                <Route path="seller-product-reviews/:id" element={<PlatformSellerProductReviewDetail />} />
                <Route path="business-reviews" element={<PlatformBusinessReviewQueue />} />
                <Route path="business-reviews/:id" element={<PlatformBusinessReviewDetail />} />
                <Route path="users" element={<PlatformUsers />} />
                <Route path="user-registry" element={<PlatformUserRegistry />} />
                <Route path="businesses" element={<PlatformBusinesses />} />
                <Route path="parties" element={<PlatformParties />} />
                <Route path="manufacturers" element={<PlatformManufacturers />} />
                <Route path="brands" element={<PlatformBrands />} />
                <Route path="brand-claims" element={<PlatformBrands />} />
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
