import type {
  Business,
  BusinessPermission,
  BusinessRole,
  BusinessRolePermission,
  BusinessMembership,
} from '../schemas';

export const mockBusinesses: Business[] = Array.from({ length: 10 }, (_, i) => {
  const index = i + 1;
  const charLabel = String.fromCharCode(64 + index); // A, B, C, D...
  return {
    id: `business-${index}`,
    name: `Business ${charLabel}`,
    slug: `business-${charLabel.toLowerCase()}`,
    registration_number: `REG-GLOBAL-${1000 + index}`,
    default_currency: index % 3 === 0 ? 'USD' : index % 3 === 1 ? 'EUR' : 'INR',
    country_of_incorporation: index % 2 === 0 ? 'USA' : 'DEU',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
});

export const mockBusinessPermissions: BusinessPermission[] = [
  { id: 'bperm-1', code: 'tenant.dashboard.view', description: 'View tenant dashboard', created_at: new Date().toISOString() },
  { id: 'bperm-2', code: 'tenant.team.manage', description: 'Manage business team members', created_at: new Date().toISOString() },
  { id: 'bperm-3', code: 'tenant.rfq.create', description: 'Create outbound RFQs', created_at: new Date().toISOString() },
  { id: 'bperm-4', code: 'tenant.rfq.respond', description: 'Respond to inbound RFQs', created_at: new Date().toISOString() },
  { id: 'bperm-5', code: 'tenant.products.manage', description: 'Manage tenant product catalog', created_at: new Date().toISOString() },
  { id: 'bperm-6', code: 'tenant.orders.view', description: 'View business orders', created_at: new Date().toISOString() },
  { id: 'bperm-7', code: 'tenant.finance.manage', description: 'Manage business invoices and payments', created_at: new Date().toISOString() },
  { id: 'bperm-8', code: 'tenant.settings.edit', description: 'Edit tenant settings and profile', created_at: new Date().toISOString() },
  { id: 'bperm-9', code: 'tenant.audit.view', description: 'View business audit logs', created_at: new Date().toISOString() },
  { id: 'bperm-10', code: 'tenant.roles.manage', description: 'Manage business custom roles', created_at: new Date().toISOString() },
];

export const mockBusinessRoles: BusinessRole[] = mockBusinesses.flatMap((biz, i) => {
  const index = i + 1;
  return [
    {
      id: `brole-${index}-owner`,
      business_id: biz.id,
      name: `Business ${String.fromCharCode(64 + index)} Owner`,
      description: 'Full business administration',
      created_at: new Date().toISOString(),
    },
    {
      id: `brole-${index}-member`,
      business_id: biz.id,
      name: `Business ${String.fromCharCode(64 + index)} Staff Member`,
      description: 'Standard business operational access',
      created_at: new Date().toISOString(),
    },
  ];
});

export const mockBusinessRolePermissions: BusinessRolePermission[] = mockBusinessRoles.flatMap((role) => {
  if (role.name.includes('Owner')) {
    return mockBusinessPermissions.map((perm) => ({
      role_id: role.id,
      permission_id: perm.id,
    }));
  }
  return [
    { role_id: role.id, permission_id: 'bperm-1' },
    { role_id: role.id, permission_id: 'bperm-3' },
    { role_id: role.id, permission_id: 'bperm-4' },
  ];
});

export const mockBusinessMemberships: BusinessMembership[] = Array.from({ length: 12 }, (_, i) => {
  const index = i + 1;
  const bizIndex = ((index - 1) % 10) + 1;
  const roleId = index === 1 ? `brole-1-owner` : `brole-${bizIndex}-member`;

  return {
    id: `member-${index}`,
    business_id: `business-${bizIndex}`,
    user_id: `user-${index}`,
    credential_id: `cred-${index}`,
    role_id: roleId,
    status: index === 10 ? 'FROZEN_BY_PLATFORM' : 'ACTIVE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
});
