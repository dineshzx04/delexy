import React from 'react';
import { Link } from 'react-router-dom';
import {
  Home, Search, Layers, TagIcon, Package, FileText,
  Settings, Building2, FileSignature, CreditCard,
  ShieldAlert, Users
} from 'lucide-react';
import { PATHS } from './paths';

// Defines the actors/contexts required to see each menu item.
// Contexts: 'user' (Individual User), 'org' (Organization), 'platform_admin' (Platform Admin)
export type ActorContext = 'user' | 'org' | 'platform_admin';

export interface SitemapItem {
  key: string;
  icon?: React.ReactNode;
  label?: React.ReactNode;
  roles?: ActorContext[];
  children?: SitemapItem[];
  type?: 'divider';
}

export const masterMenuItems: SitemapItem[] = [
  // --- Public / Marketplace (Visible to users & orgs) ---
  { key: PATHS.HOME, icon: <Home size={15} />, label: <Link to={PATHS.HOME}>Marketplace Home</Link>, roles: ['user', 'org'] },
  {
    key: 'categories',
    icon: <Layers size={15} />,
    label: 'Shop by Category',
    roles: ['user', 'org'],
    children: [
      { key: `${PATHS.PRODUCTS}?cat=valves`, label: <Link to={PATHS.PRODUCTS}>Valves & Actuators</Link> },
      { key: `${PATHS.PRODUCTS}?cat=pumps`, label: <Link to={PATHS.PRODUCTS}>Pumps & Motors</Link> },
      { key: `${PATHS.PRODUCTS}?cat=fittings`, label: <Link to={PATHS.PRODUCTS}>Pipe Fittings</Link> },
      { key: `${PATHS.PRODUCTS}?cat=electrical`, label: <Link to={PATHS.PRODUCTS}>Electrical Components</Link> },
    ]
  },
  { key: PATHS.PRODUCTS, icon: <Search size={15} />, label: <Link to={PATHS.PRODUCTS}>All Products</Link>, roles: ['user', 'org'] },
  { key: 'brands', icon: <TagIcon size={15} />, label: 'Top Brands', roles: ['user', 'org'] },

  // --- Divider ---
  { key: 'divider-1', type: 'divider', roles: ['user', 'org'] },

  // --- User Dashboard ---
  { key: PATHS.DASHBOARD, icon: <Home size={15} />, label: <Link to={PATHS.DASHBOARD}>User Dashboard</Link>, roles: ['user'] },
  { key: PATHS.RFQS, icon: <FileText size={15} />, label: <Link to={PATHS.RFQS}>My Custom RFQs</Link>, roles: ['user'] },
  { key: PATHS.USER_ORDERS, icon: <Package size={15} />, label: 'My Orders', roles: ['user'] },
  { key: PATHS.USER_SETTINGS, icon: <Settings size={15} />, label: <Link to={PATHS.USER_SETTINGS}>User Settings</Link>, roles: ['user'] },

  // --- Organization Dashboard ---
  { key: PATHS.DASHBOARD, icon: <Building2 size={15} />, label: <Link to={PATHS.DASHBOARD}>Org Overview</Link>, roles: ['org'] },
  { key: PATHS.SELLER_PRODUCTS, icon: <Package size={15} />, label: <Link to={PATHS.SELLER_PRODUCTS}>Products (PIM)</Link>, roles: ['org'] },
  { key: PATHS.RFQS, icon: <FileText size={15} />, label: <Link to={PATHS.RFQS}>Quotes & RFQs</Link>, roles: ['org'] },
  { key: PATHS.ORG_ORDERS, icon: <FileSignature size={15} />, label: 'Orders & Contracts', roles: ['org'] },
  { key: PATHS.ORG_FINANCE, icon: <CreditCard size={15} />, label: 'Finance & Invoices', roles: ['org'] },
  { key: PATHS.ORG_SETTINGS, icon: <Settings size={15} />, label: <Link to={PATHS.ORG_SETTINGS}>Org Settings</Link>, roles: ['org'] },

  // --- Admin Dashboard ---
  { key: 'divider-2', type: 'divider', roles: ['platform_admin'] },
  { key: PATHS.ADMIN, icon: <ShieldAlert size={15} />, label: <Link to={PATHS.ADMIN}>Dashboard</Link>, roles: ['platform_admin'] },
  { key: PATHS.ADMIN_ORGS, icon: <Building2 size={15} />, label: <Link to={PATHS.ADMIN_ORGS}>Organizations</Link>, roles: ['platform_admin'] },
  { key: PATHS.ADMIN_USERS, icon: <Users size={15} />, label: 'Users', roles: ['platform_admin'] },
  {
    key: 'pim',
    icon: <Layers size={15} />,
    label: 'PIM',
    roles: ['platform_admin'],
    children: [
      { key: PATHS.ADMIN_CATEGORIES, label: <Link to={PATHS.ADMIN_CATEGORIES}>Categories</Link> },
      { key: PATHS.ADMIN_ATTRIBUTES, label: 'Attributes' },
      { key: PATHS.ADMIN_MASTER_PRODUCTS, label: 'Master Products' },
    ]
  },
  { key: PATHS.ADMIN_SETTINGS, icon: <Settings size={15} />, label: 'Platform Settings', roles: ['platform_admin'] },
];

export const getMenuItemsByContext = (context: ActorContext, menuItems: SitemapItem[] = masterMenuItems): SitemapItem[] => {
  return menuItems.filter(item => !item.roles || item.roles.includes(context));
};
