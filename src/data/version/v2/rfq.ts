import type { PartyOwnerType } from "../../business/business.module";

export type AttributeType = "SYSTEM" | "CUSTOM";
export type VariantAccessType = "PUBLIC" | "PRIVATE_SHARED" | "RFQ_BOUND";

// ============================================================================
// SECTION 1: CORE DATABASE TABLES / ENTITIES
// ============================================================================

export interface Rfq {
  id: string;
  rfq_number: string;
  title: string;
  description?: string;
  status: RfqStatus;

  // Requester Info
  requester_id: string;
  requester_name: string;
  requester_party_id?: string;
  requester_party_type?: PartyOwnerType;
  contact_email?: string;
  contact_phone?: string;

  // Logistics & Budget Terms
  shipping_destination?: string;
  submission_deadline: string;
  total_items_count?: number;
  total_estimated_budget?: number;
  currency?: string;

  created_at: string;
  updated_at: string;
}

export interface RfqItem {
  id: string;
  rfq_id: string;
  category_id: string;
  catalog_product_id: string | null;
  variant_id: string | null;
  seller_product_id: string | null;
  item_index: number;
  quantity: number;
  unit: string;
  status: RfqItemStatus;
  seller_assignments?: SellerAssignment[];

  created_at: string;
  updated_at: string;
}

export interface RfqItemAttribute {
  id: string;
  rfq_item_id: string;
  attribute_type?: AttributeType;
  group_id: string;
  attribute_id: string;
  values: ItemAttributeValue[];
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface SellerQuote {
  id: string;
  rfq_item_id: string;
  seller_party_id: string;
  status: SellerQuoteStatus;

  lead_time_days?: number;

  created_at: string;
  updated_at: string;
}

export interface SellerQuoteAttribute {
  id: string;
  seller_quote_id: string;
  attribute_type?: AttributeType;
  group_id: string;
  attribute_id: string;
  values: ItemAttributeValue[];
  is_deviation: boolean;
  rejection_comment?: string;
}

export interface RfqAward {
  id: string;
  rfq_id: string;
  seller_quote_header_id: string;
  seller_party_id: string;

  total_awarded_amount: number;
  currency?: string;
  award_status: AwardStatus;

  purchase_order_id?: string | null;
  awarded_at: string;
  awarded_by_user_id: string;

  // Purchase Order Execution Terms
  shipping_address?: string;
  payment_terms?: string;
  delivery_notes?: string;
  po_released_at?: string;
  po_received_at?: string;
}

// ============================================================================
// SECTION 2: PRODUCT SPEC & SHARED VARIANT ENTITIES
// ============================================================================

/**
 * Product Variant (Base 001 or Candidate Deviation 002)
 */
export interface ProductVariant {
  id: string;
  product_id: string; // Base Parent Product ID
  parent_variant_id?: string | null; // If derived from an existing variant
  sku_code: string;
  variant_name: string;

  price?: number;
  moq?: number;
  is_custom_deviation: boolean;
  is_verified: boolean; // Platform Admin Verification Status

  created_at: string;
  updated_at: string;
}

/**
 * Maps variant access permissions between Buyer and Seller.
 * Solves the "Private Shared Custom Variant" post-award requirement.
 */
export interface VariantPartyMapping {
  id: string;
  variant_id: string;
  buyer_party_id?: string | null;
  seller_party_id?: string | null;
  access_type: VariantAccessType;
  originating_rfq_id?: string | null;
  created_at: string;
}

// ============================================================================
// SECTION 3: LIFECYCLE ENUMS & VALUE OBJECTS
// ============================================================================

export type RfqStatus =
  | "DRAFT"
  | "ISSUED" // Sellers can respond
  | "IN_PROGRESS" // Active response period
  | "EVALUATING" // Buyer is comparing/selecting
  | "AWARDED" // Award decision made
  | "CLOSED" // Process completed
  | "CANCELLED";

export type RfqItemStatus = "OPEN" | "AWARDED" | "CANCELLED";

export interface ItemAttributeValue {
  value_id: string;
  value_label: string;
}

export type SellerQuoteStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "REVISION_REQUIRED"
  | "ACCEPTED"
  | "REJECTED";

export type AwardStatus =
  | "AWARDED"
  | "PO_PENDING_VERIFICATION" // Custom Spec Express Admin Review
  | "PO_CREATED"
  | "PO_RECEIVED"
  | "CANCELLED";

export interface SellerQuoteComment {
  id: string;
  seller_quote_id: string;
  group_id: string;
  attribute_id: string;
  comment: string;
  parent_comment_id?: string;
  actor_type: "BUYER" | "SELLER";
  actor_id: string;
  created_at: string;
  attribute_type?: AttributeType;
}

export interface SellerAssignment {
  id: string;
  rfq_item_id: string;
  seller_party_id: string;
  assignment_type: "DIRECT_INVITATION" | "PUBLIC_MARKETPLACE";
  assigned_by_user_id: string;
  assigned_at: string;
}
