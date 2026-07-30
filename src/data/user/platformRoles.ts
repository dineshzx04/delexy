import type { PlatformRole } from './user.module';

export const mockPlatformRoles: PlatformRole[] = [
  {
    id: 'p-role-1',
    role_name: 'Platform Admin',
    description: 'Full administrative access across users, roles, party claims, and catalog taxonomy.',
    permissions: ['MANAGE_USERS', 'MANAGE_ROLES', 'APPROVE_CLAIMS', 'MANAGE_TAXONOMY', 'VIEW_AUDIT_LOGS'],
    created_at: '2026-01-15T08:00:00.000Z',
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'p-role-2',
    role_name: 'Operations Manager',
    description: 'Manages domain party claims, brand verifications, and seller product compliance.',
    permissions: ['APPROVE_CLAIMS', 'MANAGE_TAXONOMY', 'VIEW_AUDIT_LOGS'],
    created_at: '2026-01-15T08:00:00.000Z',
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'p-role-3',
    role_name: 'IT Team Lead',
    description: 'Manages platform system settings, security configurations, and audit logs.',
    permissions: ['MANAGE_SYSTEM_SETTINGS', 'VIEW_AUDIT_LOGS'],
    created_at: '2026-02-01T08:00:00.000Z',
    updated_at: '2026-02-01T08:00:00.000Z',
  },
  {
    id: 'p-role-4',
    role_name: 'Claims Reviewer',
    description: 'Dedicated team member reviewing submitted brand and manufacturer party claims.',
    permissions: ['APPROVE_CLAIMS'],
    created_at: '2026-03-01T08:00:00.000Z',
    updated_at: '2026-03-01T08:00:00.000Z',
  },
];
