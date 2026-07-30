import type { Role } from "./user.module";

export const mockRoles: Role[] = [
  {
    id: "role-owner-a",
    business_id: "bus-a",
    role_name: "Corporate Owner",
    permissions: ["READ", "WRITE", "ADMIN", "MANAGE_MEMBERS", "MANAGE_BRANDS"],
    created_at: "2026-01-15T08:00:00.000Z",
    updated_at: "2026-01-15T08:00:00.000Z",
  },
  {
    id: "role-admin-b",
    business_id: "bus-b",
    role_name: "Regional Admin",
    permissions: ["READ", "WRITE", "MANAGE_MEMBERS", "MANAGE_BRANDS"],
    created_at: "2026-01-15T08:00:00.000Z",
    updated_at: "2026-01-15T08:00:00.000Z",
  },
  {
    id: "ubr-1",
    business_id: "bus-c",
    role_name: "Catalog Manager",
    permissions: ["READ", "WRITE", "MANAGE_PRODUCTS"],
    created_at: "2026-03-15T08:00:00.000Z",
    updated_at: "2026-03-15T08:00:00.000Z",
  },
  {
    id: "role-mgr-d",
    business_id: "bus-d",
    role_name: "Operations Manager",
    permissions: ["READ", "WRITE", "MANAGE_RFQS"],
    created_at: "2026-04-10T08:00:00.000Z",
    updated_at: "2026-04-10T08:00:00.000Z",
  },
];
