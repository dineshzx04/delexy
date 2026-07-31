import type { Manufacturer } from "./business.module";

export const mockManufacturers: Manufacturer[] = [
  // Claimed Manufacturer 1: Samsung India (pty-1)
  {
    id: "mfg-1",
    manufacturer_party_id: "pty-1",
    company_name: "Samsung India Electronics Pvt Ltd",
    registration_number: "REG-IN-884920",
    status: "ACTIVE",
    created_at: "2026-01-15T08:00:00.000Z",
    updated_at: "2026-01-15T08:00:00.000Z",
  },
  // Claimed Manufacturer 2: Sony Corporation (pty-4)
  {
    id: "mfg-2",
    manufacturer_party_id: "pty-4",
    company_name: "Sony Corporation Manufacturing",
    registration_number: "REG-JP-991240",
    status: "ACTIVE",
    created_at: "2026-01-15T08:00:00.000Z",
    updated_at: "2026-01-15T08:00:00.000Z",
  },
  // Unclaimed Manufacturer 3: ASICS Global (pty-3)
  {
    id: "mfg-3",
    manufacturer_party_id: "pty-3",
    company_name: "ASICS Global Manufacturing Placeholder",
    registration_number: "REG-JP-551029",
    status: "PENDING_VERIFICATION",
    created_at: "2026-05-10T08:00:00.000Z",
    updated_at: "2026-05-10T08:00:00.000Z",
  },
  // Claimed Manufacturer 4: ASUSTeK Computer Inc (pty-5)
  {
    id: "mfg-4",
    manufacturer_party_id: "pty-5",
    company_name: "ASUSTeK Computer Inc Manufacturing",
    registration_number: "REG-TW-331001",
    status: "ACTIVE",
    created_at: "2026-04-10T08:00:00.000Z",
    updated_at: "2026-04-10T08:00:00.000Z",
  },
  // Unclaimed Manufacturer 5: Logitech Inc Placeholder (pty-7)
  {
    id: "mfg-5",
    manufacturer_party_id: "pty-7",
    company_name: "Logitech International Manufacturing Placeholder",
    registration_number: "REG-CH-771802",
    status: "PENDING_VERIFICATION",
    created_at: "2026-06-01T08:00:00.000Z",
    updated_at: "2026-06-01T08:00:00.000Z",
  },
];
