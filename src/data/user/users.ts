import type { User } from "./user.module";

export const mockUsers: User[] = [
  // Super Admin: Dedicated Platform Root Administrator (is_platform_active: true -> ONLY Platform Context)
  {
    id: "usr-1",
    app_user_id: "SUPERADMIN-001",
    first_name: "Super",
    last_name: "Admin",
    full_name: "Platform SuperAdmin",
    date_of_birth: "1990-01-01",
    place_of_birth: "System Core",
    country_of_residence: "Global Platform",
    is_active: true,
    is_platform_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-07-20T12:00:00.000Z",
  },
  // User 2: John Doe (Individual Buyer/Seller & Business Owner)
  {
    id: "usr-2",
    app_user_id: "USR-984201",
    first_name: "John",
    last_name: "Doe",
    full_name: "John Doe",
    date_of_birth: "2000-01-01",
    place_of_birth: "New York, USA",
    country_of_residence: "United States",
    is_active: true,
    is_platform_active: false,
    created_at: "2026-01-15T08:00:00.000Z",
    updated_at: "2026-07-20T12:00:00.000Z",
  },
  // User 3: Alice Smith (Individual User & Member)
  {
    id: "usr-3",
    app_user_id: "USR-984202",
    first_name: "Alice",
    last_name: "Smith",
    full_name: "Alice Smith",
    date_of_birth: "2002-03-10",
    place_of_birth: "Los Angeles, USA",
    country_of_residence: "United States",
    is_active: true,
    is_platform_active: false,
    created_at: "2026-03-15T08:00:00.000Z",
    updated_at: "2026-07-20T12:00:00.000Z",
  },
  // User 4: Robert Johnson (Business Owner)
  {
    id: "usr-4",
    app_user_id: "USR-984203",
    first_name: "Robert",
    last_name: "Johnson",
    full_name: "Robert Johnson",
    date_of_birth: "1995-07-24",
    place_of_birth: "Chicago, USA",
    country_of_residence: "United States",
    is_active: true,
    is_platform_active: false,
    created_at: "2026-04-10T08:00:00.000Z",
    updated_at: "2026-07-20T12:00:00.000Z",
  },
];
