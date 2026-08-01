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

export interface BusinessSubmissionSectionItem {
  field_key: string;
  field_label: string;
  section: 'CORE_INFO' | 'LEGAL_TAX' | 'ADDRESS' | 'CLAIMED_BRANDS' | 'CLAIMED_MANUFACTURER' | 'DOCUMENTS';
  value: any;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_comment?: string;
}

export interface BusinessSubmissionDocument {
  id: string;
  doc_type: 'TAX_CERTIFICATE' | 'BUSINESS_LICENSE' | 'TRADEMARK_REGISTRATION' | 'DEALER_AUTHORIZATION' | 'ID_PROOF';
  doc_name: string;
  doc_url: string;
  file_size?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_comment?: string;
}

export interface BusinessSubmissionAudit {
  id: string;
  round: number;
  actor_id: string;
  actor_name: string;
  action: 'SUBMITTED' | 'REQUESTED_REVISION' | 'APPROVED' | 'REJECTED';
  notes?: string;
  timestamp: string;
}

export interface BusinessSubmission {
  id: string;
  user_id: string;
  business_name: string;
  legal_name: string;
  website?: string;
  phone?: string;
  country_code: string;
  tax_id: string;
  registration_number?: string;
  
  address: {
    line1: string;
    line2?: string;
    city: string;
    state_province: string;
    postal_code: string;
    country_code: string;
  };

  to_claim_party_id?: string;
  to_claim_party_name: string;
  
  documents: BusinessSubmissionDocument[];
  sections: Record<string, BusinessSubmissionSectionItem>;

  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'NEEDS_REVISION' | 'APPROVED' | 'REJECTED';
  current_round: number;
  submitted_at?: string;
  reviewed_at?: string;
  reviewed_by_user_name?: string;
  
  audit_history: BusinessSubmissionAudit[];

  created_at: string;
  updated_at: string;
}
