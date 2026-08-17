import type { PartyOwnerType } from "../../business/business.module";

export type AttributeType = "SYSTEM" | "CUSTOM";
export type VariantAccessType = "PUBLIC" | "PRIVATE_SHARED" | "RFQ_BOUND";

// ============================================================================
// SECTION 1: CORE DATABASE TABLES / ENTITIES (Persisted in Dexie DB)
// ============================================================================

/**
 * RFQ Header: Defines overall procurement event.
 * Enforces Header-Level Award rules (1 RFQ = 1 Award = 1 Purchase Order).
 */
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
  created_by_user_id?: string;
  contact_email?: string;
  contact_phone?: string;
  
  // Logistics & Budget Terms
  shipping_destination?: string;
  submission_deadline: string;
  total_items_count?: number;
  total_estimated_budget?: number;
  currency?: string;
  
  // Header-Level Award Details (Set when RFQ is awarded)
  awarded_seller_party_id?: string | null;
  awarded_quote_id?: string | null;
  awarded_at?: string | null;
  
  created_at: string;
  updated_at: string;
}

/**
 * RFQ Line Item: Represents a specific item within an RFQ.
 * Linked to Category Leaf and mapped specs (Spec 001).
 */
export interface RfqItem {
  id: string;
  rfq_id: string;
  category_id: string; // Leaf category ID driving mappedGroupIds
  item_index: number;
  quantity: number;
  unit: string;
  status: RfqItemStatus;
  
  // Product Spec Association (Spec 001)
  item_source: RfqItemSource;
  catalog_product_id?: string | null; // Base Product / Spec 001 ID
  variant_id?: string | null;         // Selected base variant ID (if any)
  product_name?: string;
  
  target_unit_price?: number;
  brand_id?: string[] | null;
  manufacturer_id?: string[] | null;
  
  created_at: string;
  updated_at: string;
}

/**
 * Buyer Spec Attributes for Line Item (Spec 001 snapshot)
 */
export interface RfqItemAttribute {
  id: string;
  rfq_item_id: string;
  group_id: string;
  attribute_id: string;
  attribute_type?: AttributeType;
  description?: string;
  values: ItemAttributeValue[];
  created_at: string;
  updated_at: string;
}

/**
 * Seller Quote Package (Header-Level Bid)
 * Represents the seller's complete quote package for the entire RFQ.
 */
export interface SellerQuoteHeader {
  id: string;
  rfq_id: string;
  seller_party_id: string;
  seller_quote_number: string;
  status: SellerQuoteStatus;
  
  total_quoted_amount: number;
  currency: string;
  valid_until: string;
  payment_terms?: string;
  shipping_terms?: string;
  
  created_at: string;
  updated_at: string;
}

/**
 * Seller Quote Line Item
 * Per-item pricing, lead times, and candidate attribute deviations (Spec 002).
 */
export interface SellerQuote {
  id: string;
  seller_quote_header_id: string; // Belongs to SellerQuoteHeader package
  rfq_item_id: string;
  seller_party_id: string;
  
  unit_price: number;
  offered_quantity: number;
  lead_time_days?: number;
  status: SellerQuoteStatus;

  // Deviation Logic (Spec 002 Handling)
  has_deviation: boolean;
  parent_variant_id?: string | null;    // Spec 001 reference
  candidate_variant_id?: string | null; // Spec 002 (Draft generated on deviation)
  
  brand_id?: string[] | null;
  manufacturer_id?: string[] | null;
  
  created_at: string;
  updated_at: string;
}

/**
 * Offered Attribute Values when Seller proposes a Deviation (Spec 002)
 */
export interface SellerQuoteAttribute {
  id: string;
  seller_quote_id: string;
  group_id: string;
  attribute_id: string;
  offered_values: ItemAttributeValue[];
  is_deviation: boolean; // Flag set if different from Buyer's RfqItemAttribute
  attribute_type?: AttributeType;
}

/**
 * Single Header Award Entity
 * Links awarded RFQ Header to Winning Seller Quote & Purchase Order.
 */
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
  | "PENDING_VERIFICATION" // Buyer Spec Verification Queue
  | "ISSUED"               // Broadcasted to Sellers
  | "IN_PROGRESS"          // Quotes Received
  | "AWARDED"              // Awarded to single seller
  | "CANCELLED"
  | "CLOSED";

export type RfqItemStatus = "OPEN" | "AWARDED" | "CANCELLED";

export type RfqItemSource = "CATALOG_PRODUCT_VARIANT" | "CUSTOM_REQUIREMENTS";

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