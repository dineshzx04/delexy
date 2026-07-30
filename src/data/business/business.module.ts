export type PartyOwnerType = "USER" | "BUSINESS";

export interface Party {
  id: string;
  owner_type: PartyOwnerType;
  owner_id?: string | null; // Null if unclaimed placeholder party
  display_name: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  is_claimed: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface PartyClaim {
  id: string;
  target_party_id: string;
  claimant_party_id: string;
  claimant_user_id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BrandParty {
  id: string;
  brand_id: string; // Foreign key to Brand.id
  party_id: string; // Foreign key to Party.id
  claim_status: "PENDING" | "APPROVED" | "VERIFIED";
  created_at: string;
  updated_at: string;
}

export interface Manufacturer {
  id: string;
  manufacturer_party_id: string; // Links strictly to Party.id (1:1)
  company_name: string;
  registration_number?: string;
  status: "ACTIVE" | "INACTIVE" | "PENDING_VERIFICATION";
  created_at: string;
  updated_at: string;
}
