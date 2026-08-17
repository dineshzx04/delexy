export type AttributeType = "SYSTEM" | "CUSTOM";
export type ProductOwnerPartyType = "SELLER" | "BUYER" | "PLATFORM";
export type ProductVisibilityType = "PUBLIC" | "PRIVATE_SHARED" | "RFQ_BOUND";

// ============================================================================
// SECTION 1: TAXONOMY SCHEMA (Unchanged Core Engine)
// ============================================================================

export interface AttributeValue {
  id: string;
  attributeId: string;
  value: string;
  label?: string;
}

export interface Attribute {
  id: string;
  name: string;
  code?: string;
  label?: string;
  valueIds?: string[];
  unit?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AttributeGroup {
  id: string;
  name: string;
  attributeIds: string[];
  created_at?: string;
  updated_at?: string;
}

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  parentId: string | null;
  level?: number;
  mappedGroupIds: string[];
  childrenCount?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CatalogProduct {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  isActive?: boolean;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// SECTION 2: PRODUCT SPECIFICATIONS & VARIANTS
// ============================================================================

export interface SellerProductAttributeSelection {
  group_id: string;
  attribute_id: string;
  selected_value_ids: string[];
  is_variant: boolean;
}

export interface SellerProductSpecification {
  group_id: string;
  group_name?: string;
  attribute_id: string;
  attribute_name: string;
  values: Array<{ id: string; label: string }>;
}

export interface SellerProductVariantCombinationValue {
  group_id: string;
  group_name?: string;
  attribute_id: string;
  attribute_name: string;
  value_id: string;
  label: string;
}

/**
 * Enhanced Product Variant (Handles Catalog SKUs & RFQ Deviations)
 */
export interface SellerProductVariant {
  id: string;                         // Local/System Variant ID ('sprod-1-v1')
  variant_platform_id: string;        // Universal Platform Variant SKU ID ('gpid-10101')
  sku: string;                        // SKU code ('SM-S928B-BLK-512')
  price: number;
  currency: string;
  stock: number;
  min_order_quantity: number;
  combination_values: SellerProductVariantCombinationValue[];

  // Inheritance & Deviation Extensions (Spec 001 vs Spec 002)
  parent_variant_id?: string | null;  // Points to Spec 001 if this is a deviation Spec 002
  is_deviation?: boolean;             // True if created via RFQ deviation counter-proposal
  originating_rfq_id?: string | null;  // Links deviation variant to originating RFQ
  is_verified?: boolean;              // Platform verification status for custom specs
}

/**
 * Enhanced Product Entity (Supports both Seller Products and Buyer Spec Products)
 */
export interface SellerProduct {
  id: string;                         // Unique System Product ID (e.g. 'sprod-1')
  category_id: string;                // Leaf Category ID ('c-2-1-1')
  catalog_product_id: string;         // Master Catalog Product Template ID ('prod-1')
  product_name: string;               // Listing / Spec Title
  manufacturer_id?: string;
  brand_id?: string;
  
  // Multi-Tenant Ownership & Access Controls
  owner_party_id: string;             // Owner Party ID (Buyer, Seller, or Platform)
  owner_party_type: ProductOwnerPartyType; 
  visibility_type: ProductVisibilityType; // Public catalog vs. Private Buyer/Seller library
  allowed_party_ids?: string[];      // Explicit party IDs allowed to view/order this item if PRIVATE

  dynamic_attributes: SellerProductAttributeSelection[];
  specifications: SellerProductSpecification[];
  variants: SellerProductVariant[];

  // Workflow & Governance Flags
  is_locked?: boolean;                // Governance flag: true once verified and locked
  is_custom_spec?: boolean;           // True if created via Buyer RFQ requirement
  status: "ACTIVE" | "INACTIVE" | "PENDING_VERIFICATION";
  created_at: string;
  updated_at: string;
}

// ============================================================================
// SECTION 3: SUBMISSION & EXPRESS VERIFICATION QUEUE
// ============================================================================

export interface AttributeRoundHistory {
  round: number;
  value: any;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_comment?: string;
  reviewed_by_user_name?: string;
  timestamp: string;
}

export interface SubmissionAttributeItem {
  field_key: string;
  field_label: string;
  field_group: 'IDENTIFIERS' | 'MANUFACTURING' | 'DIMENSIONS' | 'OPERATIONAL' | 'SPECS' | 'VARIANTS';
  value: any;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_comment?: string;
  reviewed_by_user_id?: string;
  reviewed_by_user_name?: string;
  reviewed_at?: string;
  round_history?: AttributeRoundHistory[];
}

export interface SubmissionAuditLog {
  id: string;
  round: number;
  actor_id: string;
  actor_name: string;
  action: 
    | 'CREATED_DRAFT' 
    | 'SUBMITTED' 
    | 'ATTRIBUTE_APPROVED' 
    | 'ATTRIBUTE_REJECTED' 
    | 'REQUESTED_REVISION' 
    | 'RESUBMITTED' 
    | 'FINAL_APPROVED' 
    | 'PUBLISHED';
  notes?: string;
  timestamp: string;
}

/**
 * Enhanced Verification Submission (Supports standard Catalog & Express RFQ queues)
 */
export interface SellerProductSubmission {
  id: string;
  party_id: string;
  submission_type: 'STANDARD_CATALOG' | 'EXPRESS_RFQ_CUSTOM_SPEC'; // Enables fast-track verification
  originating_rfq_id?: string | null;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'NEEDS_REVISION' | 'APPROVED' | 'PUBLISHED';
  current_round: number;
  published_seller_product_id?: string;
  attributes: Record<string, SubmissionAttributeItem>;
  audit_history: SubmissionAuditLog[];
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  published_at?: string;
}