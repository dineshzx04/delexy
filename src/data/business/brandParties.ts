import type { BrandParty } from "./business.module";

export const mockBrandParties: BrandParty[] = [
  // Samsung (brd-1) claimed by Samsung India (pty-1)
  {
    id: "brd-pty-1",
    brand_id: "brd-1",
    party_id: "pty-1",
    claim_status: "VERIFIED",
    created_at: "2026-01-15T08:00:00.000Z",
    updated_at: "2026-01-15T08:00:00.000Z",
  },
  // Samsung (brd-1) also claimed by Samsung UK (pty-2)
  {
    id: "brd-pty-2",
    brand_id: "brd-1",
    party_id: "pty-2",
    claim_status: "VERIFIED",
    created_at: "2026-01-15T08:00:00.000Z",
    updated_at: "2026-01-15T08:00:00.000Z",
  },
  // ASUS (brd-2) claimed by Tech World Global (pty-5)
  {
    id: "brd-pty-3",
    brand_id: "brd-2",
    party_id: "pty-5",
    claim_status: "VERIFIED",
    created_at: "2026-01-15T08:00:00.000Z",
    updated_at: "2026-01-15T08:00:00.000Z",
  },
  // Sony (brd-3) claimed by Samsung UK (pty-2)
  {
    id: "brd-pty-4",
    brand_id: "brd-3",
    party_id: "pty-2",
    claim_status: "VERIFIED",
    created_at: "2026-02-01T08:00:00.000Z",
    updated_at: "2026-02-01T08:00:00.000Z",
  },
  // ASICS (brd-4) linked to unclaimed placeholder ASICS Corp (pty-3)
  {
    id: "brd-pty-5",
    brand_id: "brd-4",
    party_id: "pty-3",
    claim_status: "PENDING",
    created_at: "2026-05-10T08:00:00.000Z",
    updated_at: "2026-05-10T08:00:00.000Z",
  },
  // Logitech (brd-5) claimed by Business C (pty-4)
  {
    id: "brd-pty-6",
    brand_id: "brd-5",
    party_id: "pty-4",
    claim_status: "APPROVED",
    created_at: "2026-03-15T08:00:00.000Z",
    updated_at: "2026-03-15T08:00:00.000Z",
  },
];
