
import { Routes, Route, Navigate } from 'react-router-dom';
import { PATHS } from './paths';

// Layouts
import AuthLayout from '../layouts/AuthLayout';
import AdminLayout from '../layouts/AdminLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Onboarding from '../pages/auth/Onboarding';
import CreateOrganization from '../pages/auth/CreateOrganization';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import OrgList from '../pages/admin/OrgList';
import CategoryManagement from '../pages/admin/CategoryManagement';

// Dashboard Pages
import DashboardOverview from '../pages/dashboard/DashboardOverview';
import SellerProducts from '../pages/dashboard/SellerProducts';
import RfqManagement from '../pages/dashboard/RfqManagement';
import OrgSettings from '../pages/dashboard/settings/OrgSettings';
import UserProfile from '../pages/dashboard/settings/UserProfile';

// Marketplace Pages
import Home from '../pages/marketplace/Home';
import ProductList from '../pages/marketplace/ProductList';
import ProductDetail from '../pages/marketplace/ProductDetail';
import Cart from '../pages/marketplace/Cart';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path={PATHS.LOGIN} element={<Login />} />
        <Route path={PATHS.REGISTER} element={<Register />} />
        <Route path={PATHS.ONBOARDING} element={<Onboarding />} />
        <Route path={PATHS.CREATE_ORG} element={<CreateOrganization />} />
      </Route>

      {/* Combined Application Routes (Marketplace + Dashboard) */}
      <Route path={PATHS.HOME} element={<DashboardLayout />}>
        <Route index element={<Home />} />
        <Route path={PATHS.PRODUCTS.substring(1)} element={<ProductList />} />
        <Route path="product/:id" element={<ProductDetail />} />
        <Route path={PATHS.CART.substring(1)} element={<Cart />} />
        
        <Route path="dashboard" element={<DashboardOverview />} />
        <Route path="dashboard/seller/products" element={<SellerProducts />} />
        <Route path="dashboard/rfqs" element={<RfqManagement />} />
        <Route path="dashboard/settings" element={<OrgSettings />} />
        <Route path="dashboard/user-settings" element={<UserProfile />} />
      </Route>

      {/* Admin Routes */}
      <Route path={PATHS.ADMIN} element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="organizations" element={<OrgList />} />
        <Route path="categories" element={<CategoryManagement />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to={PATHS.HOME} replace />} />
    </Routes>
  );
};
