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
  // Claimed Manufacturer 2: Samsung UK (pty-2)
  {
    id: "mfg-2",
    manufacturer_party_id: "pty-2",
    company_name: "Samsung Electronics UK Manufacturing",
    registration_number: "REG-UK-991240",
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
  // Claimed Manufacturer 4: Tech World Industrial (pty-5)
  {
    id: "mfg-4",
    manufacturer_party_id: "pty-5",
    company_name: "Tech World Industrial Manufacturing Co",
    registration_number: "REG-US-331001",
    status: "ACTIVE",
    created_at: "2026-04-10T08:00:00.000Z",
    updated_at: "2026-04-10T08:00:00.000Z",
  },
];
