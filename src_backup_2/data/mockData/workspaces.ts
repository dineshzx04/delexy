export const workspaces = [
  { id: 'ind-1', name: 'John Personal', type: 'individual' as const, role: 'Individual User' },
  { id: 'org-1', name: 'ABC Engineering Pvt Ltd', type: 'tenant' as const, role: 'Organization Owner' },
  { id: 'org-2', name: 'XYZ Manufacturing Ltd', type: 'tenant' as const, role: 'Procurement Manager' },
  { id: 'org-3', name: 'Global Suppliers Inc', type: 'tenant' as const, role: 'Supplier' },
  { id: 'plat-1', name: 'Platform Workspace', type: 'platform' as const, role: 'System Administrator' },
];
