import type { Party } from "./business.module";

export const mockParties: Party[] = [
  // Claimed Business Party: Samsung India (1 Business <-> 1 Party)
  {
    id: "pty-1",
    owner_type: "BUSINESS",
    owner_id: "bus-a",
    display_name: "Samsung India Industrial Party",
    status: "ACTIVE",
    is_claimed: true,
    is_verified: true,
    created_at: "2026-01-15T08:00:00.000Z",
    updated_at: "2026-01-15T08:00:00.000Z",
  },
  // Claimed Business Party: Samsung UK (1 Business <-> 1 Party)
  {
    id: "pty-2",
    owner_type: "BUSINESS",
    owner_id: "bus-b",
    display_name: "Samsung UK Electronics Party",
    status: "ACTIVE",
    is_claimed: true,
    is_verified: true,
    created_at: "2026-01-15T08:00:00.000Z",
    updated_at: "2026-01-15T08:00:00.000Z",
  },
  // Unclaimed Placeholder Business Party (No owner, target of clm-1)
  {
    id: "pty-3",
    owner_type: undefined,
    owner_id: null,
    display_name: "ASICS Corp Placeholder Party",
    status: "ACTIVE",
    is_claimed: false,
    is_verified: false,
    created_at: "2026-05-10T08:00:00.000Z",
    updated_at: "2026-05-10T08:00:00.000Z",
  },
  // Claimed Business Party: Business C (1 Business <-> 1 Party)
  {
    id: "pty-4",
    owner_type: "BUSINESS",
    owner_id: "bus-c",
    display_name: "Business C Enterprise Party",
    status: "ACTIVE",
    is_claimed: true,
    is_verified: true,
    created_at: "2026-03-15T08:00:00.000Z",
    updated_at: "2026-03-15T08:00:00.000Z",
  },
  // Claimed Business Party: Tech World Global (1 Business <-> 1 Party)
  {
    id: "pty-5",
    owner_type: "BUSINESS",
    owner_id: "bus-d",
    display_name: "Tech World Global Distribution Party",
    status: "ACTIVE",
    is_claimed: true,
    is_verified: true,
    created_at: "2026-04-10T08:00:00.000Z",
    updated_at: "2026-04-10T08:00:00.000Z",
  },
  // Claimed Individual User Party: John Doe (Cannot own Manufacturer/Brand)
  {
    id: "pty-6",
    owner_type: "USER",
    owner_id: "usr-1",
    display_name: "John Doe Personal Trading Party",
    status: "ACTIVE",
    is_claimed: true,
    is_verified: true,
    created_at: "2026-01-15T08:00:00.000Z",
    updated_at: "2026-01-15T08:00:00.000Z",
  },
  // Unclaimed Placeholder Business Party (No owner, target of clm-2 rejected claim)
  {
    id: "pty-7",
    owner_type: undefined,
    owner_id: null,
    display_name: "Sony Logistics Unclaimed Party",
    status: "SUSPENDED",
    is_claimed: false,
    is_verified: false,
    created_at: "2026-06-01T08:00:00.000Z",
    updated_at: "2026-06-01T08:00:00.000Z",
  },
];
