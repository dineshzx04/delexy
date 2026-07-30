import type { PlatformMembership } from "./user.module";

export const mockPlatformMemberships: PlatformMembership[] = [
  // Super Admin: Single top-level root platform owner (No email, no business, pure platform admin)
  {
    id: "p-bm-1",
    user_id: "usr-1",
    membership_type: "SUPER_ADMIN",
    platform_role_id: null,
    status: "ACTIVE",
    require_switch_password: true,
    switch_password: "admin123",
    created_at: "2026-01-15T08:00:00.000Z",
    updated_at: "2026-01-15T08:00:00.000Z",
  },
  {
    id: "p-bm-4",
    user_id: "usr-4",
    membership_type: "PLATFORM_MEMBER",
    platform_role_id: "p-role-3",
    status: "ACTIVE",
    require_switch_password: false,
    created_at: "2026-04-10T08:00:00.000Z",
    updated_at: "2026-04-10T08:00:00.000Z",
  },
];
