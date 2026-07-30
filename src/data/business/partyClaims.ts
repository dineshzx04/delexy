import type { PartyClaim } from "./business.module";

export const mockPartyClaims: PartyClaim[] = [
  // Pending Party Claim: Business C (pty-4) claiming unclaimed ASICS Corp (pty-3)
  {
    id: "clm-1",
    target_party_id: "pty-3",
    claimant_party_id: "pty-4",
    claimant_user_id: "usr-1",
    status: "PENDING",
    notes: "Business C submitting legal ownership claim for placeholder ASICS Corp entry.",
    created_at: "2026-06-01T10:00:00.000Z",
    updated_at: "2026-06-01T10:00:00.000Z",
  },
  // Rejected Party Claim: Tech World (pty-5) claiming unclaimed Sony Logistics (pty-7)
  {
    id: "clm-2",
    target_party_id: "pty-7",
    claimant_party_id: "pty-5",
    claimant_user_id: "usr-2",
    status: "REJECTED",
    notes: "Rejected due to insufficient corporate authorization documentation.",
    created_at: "2026-06-15T14:30:00.000Z",
    updated_at: "2026-06-18T09:15:00.000Z",
  },
];
