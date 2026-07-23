import type {
  PlatformPermission,
  PlatformRole,
  PlatformRolePermission,
  UserPlatformRole,
  Attribute,
  AttributeValue,
  AttributeGroup,
  Category,
} from '../schemas';

export const mockPlatformPermissions: PlatformPermission[] = [
  { id: 'perm-1', code: 'platform.system.config', description: 'Configure global system parameters', created_at: new Date().toISOString() },
  { id: 'perm-2', code: 'platform.businesses.view', description: 'View all registered global businesses', created_at: new Date().toISOString() },
  { id: 'perm-3', code: 'platform.businesses.freeze', description: 'Freeze or suspend non-compliant tenants', created_at: new Date().toISOString() },
  { id: 'perm-4', code: 'platform.users.manage', description: 'Manage global platform user accounts', created_at: new Date().toISOString() },
  { id: 'perm-5', code: 'platform.attributes.manage', description: 'Manage taxonomy attribute specifications', created_at: new Date().toISOString() },
  { id: 'perm-6', code: 'platform.categories.manage', description: 'Manage global product category hierarchy', created_at: new Date().toISOString() },
  { id: 'perm-7', code: 'platform.audit.view', description: 'Access global compliance audit logs', created_at: new Date().toISOString() },
  { id: 'perm-8', code: 'platform.billing.manage', description: 'Manage platform global billing & plans', created_at: new Date().toISOString() },
  { id: 'perm-9', code: 'platform.roles.manage', description: 'Manage super admin platform RBAC roles', created_at: new Date().toISOString() },
  { id: 'perm-10', code: 'platform.reports.view', description: 'View system-wide platform analytics', created_at: new Date().toISOString() },
];

export const mockPlatformRoles: PlatformRole[] = Array.from({ length: 10 }, (_, i) => {
  const index = i + 1;
  return {
    id: `prole-${index}`,
    name: index === 1 ? 'Super Platform Administrator' : index === 2 ? 'Platform Audit Manager' : `Platform Role ${index}`,
    description: `Platform administration role tier ${index}`,
    is_system_default: index <= 2,
    created_at: new Date().toISOString(),
  };
});

export const mockPlatformRolePermissions: PlatformRolePermission[] = mockPlatformRoles.flatMap((role) => {
  return mockPlatformPermissions.slice(0, 5).map((perm) => ({
    role_id: role.id,
    permission_id: perm.id,
  }));
});

export const mockUserPlatformRoles: UserPlatformRole[] = [
  { user_id: 'user-2', role_id: 'prole-1', granted_at: new Date().toISOString() },
  { user_id: 'user-12', role_id: 'prole-2', granted_at: new Date().toISOString() },
];

// Attribute Values (val-1 to val-10)
export const mockAttributeValues: AttributeValue[] = Array.from({ length: 12 }, (_, i) => {
  const index = i + 1;
  const attrIndex = Math.ceil(index / 2);
  return {
    id: `val-${index}`,
    attributeId: `attr-${attrIndex}`,
    value: `Value ${index} Spec`,
    code: `VAL_${index}`,
    displayOrder: index,
  };
});

// Attributes (attr-1 to attr-10)
export const mockAttributes: Attribute[] = Array.from({ length: 10 }, (_, i) => {
  const index = i + 1;
  return {
    id: `attr-${index}`,
    name: `Attribute ${index}`,
    code: `ATTR_${index}`,
    type: index % 3 === 0 ? 'SELECT' : index % 3 === 1 ? 'TEXT' : 'NUMBER',
    description: `Global taxonomy attribute specification ${index}`,
    isRequired: index % 2 === 0,
    valueIds: [`val-${(index * 2) - 1}`, `val-${index * 2}`],
  };
});

// Attribute Groups (group-1 to group-10)
export const mockAttributeGroups: AttributeGroup[] = Array.from({ length: 10 }, (_, i) => {
  const index = i + 1;
  return {
    id: `group-${index}`,
    name: `Group ${index}`,
    code: `GROUP_${index}`,
    description: `Attribute group container ${index}`,
    attributeIds: [`attr-${index}`],
  };
});

// Categories (cat-1 to cat-10)
export const mockCategories: Category[] = Array.from({ length: 10 }, (_, i) => {
  const index = i + 1;
  return {
    id: `cat-${index}`,
    name: `Cat ${index}`,
    code: `CAT_${index}`,
    slug: `cat-${index}`,
    parentId: index === 1 ? null : `cat-${Math.floor(index / 2)}`,
    level: index === 1 ? 1 : 2,
    mappedGroupIds: [`group-${index}`],
    childrenCount: index <= 3 ? 2 : 0,
  };
});
