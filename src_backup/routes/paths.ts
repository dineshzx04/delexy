export const PATHS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  ONBOARDING: '/auth/onboarding',
  CREATE_ORG: '/auth/create-organization',

  // Public / Marketplace
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: (id: string = ':id') => `/product/${id}`,
  CART: '/cart',

  // Dashboard (Combined User/Org)
  DASHBOARD: '/dashboard',
  SELLER_PRODUCTS: '/dashboard/seller/products',
  RFQS: '/dashboard/rfqs',
  
  // User specific
  USER_ORDERS: '/dashboard/user-orders',
  USER_SETTINGS: '/dashboard/user-settings',

  // Org specific
  ORG_ORDERS: '/dashboard/org-orders',
  ORG_FINANCE: '/dashboard/finance',
  ORG_SETTINGS: '/dashboard/settings',

  // Admin
  ADMIN: '/admin',
  ADMIN_ORGS: '/admin/organizations',
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_USERS: '/admin/users',
  ADMIN_ATTRIBUTES: '/admin/attributes',
  ADMIN_MASTER_PRODUCTS: '/admin/master-products',
  ADMIN_SETTINGS: '/admin/settings',
};
