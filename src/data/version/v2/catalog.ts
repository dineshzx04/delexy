// ============================================================================
// SECTION 1: DATABASE TABLES & DOMAIN ENTITIES
// ============================================================================

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  parentId: string | null;
  level?: number;
  mappedGroupIds: string[]; // Drives dynamic forms when leaf category is selected
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

export interface AttributeGroup {
  id: string;
  name: string;
  label?: string;
  attributeIds: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Attribute {
  id: string;
  name: string;
  label?: string;
  type: "SELECT" | "MULTI_SELECT" | "INPUT" | "NUMBER" | "TEXT";
  unit?: string; // Optional measurement unit (e.g., "mm", "kg")
  isRequired?: boolean; // Useful for dynamic frontend form validation

  status: "ACTIVE" | "DEPRECATED" | "INACTIVE";
  parent_id?: string | null; // Backward pointer to legacy version
  created_at?: string;
  updated_at?: string;

  valueIds?: string[]; // Used when type is SELECT or MULTI_SELECT
}

export interface AttributeValue {
  id: string;
  value: string; // Internal key (e.g., "ss_304")
  label: string; // Display text (e.g., "Stainless Steel 304")
  code?: string; // Optional: ISO or Industry Code (e.g., "AISI 304")
}

export interface SellerProduct {
  id: string;
  category_id: string;
  catalog_product_id: string;
  product_name: string;
  manufacturer_id?: string;
  brand_id?: string;

  owner_party_id: string;
  source_product_id?: string;

  specifications: SellerProductSpecification[];
  variants: SellerProductVariant[];
  visibility: boolean;
  status: "ACTIVE" | "INACTIVE";
  created_at: string;
  updated_at: string;
}

export interface SellerProductSubmission {
  id: string;
  party_id: string;
  submission_type: "STANDARD_CATALOG" | "EXPRESS_RFQ_CUSTOM_SPEC"; // Enables fast-track verification
  originating_rfq_id?: string | null;
  status:
    | "DRAFT"
    | "SUBMITTED"
    | "UNDER_REVIEW"
    | "NEEDS_REVISION"
    | "APPROVED"
    | "PUBLISHED";
  current_round: number;
  published_seller_product_id?: string;
  audit_history: SubmissionAuditLog[];
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  published_at?: string;
  attributes: Record<string, SubmissionAttributeItem>;
}

// ============================================================================
// SECTION 2: ENUMS, UNIONS & SUB-STRUCTURES
// ============================================================================

export interface SellerProductVariant {
  seller_product_id: string;
  platform_product_variant_id: string;
  source_variant_id?: string;
  owner_party_id: string;
  variant_type?: "DEFAULT" | "COMBINATION";
  price: number;
  currency: string;
  stock: number;
  min_order_quantity: number;
  combination_values: SellerProductVariantCombinationValue[];
  status: "RETIRED" | "ACTIVE" | "DEACTIVATED";
}

// Need to add VariantParticipant

export interface SellerProductSpecification {
  group_id: string;
  group_name?: string;
  attribute_id: string;
  attribute_name: string;
  attribute_type?: AttributeType;
  values: ItemAttributeValue[];
}

export interface SellerProductVariantCombinationValue {
  group_id: string;
  group_name?: string;
  attribute_id: string;
  attribute_name: string;
  value_id: string;
  label: string;
}

export interface SubmissionAttributeItem {
  submission_id: string;
  attribute_type?: AttributeType;
  group_id: string;
  attribute_id: string;
  values: ItemAttributeValue[];
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejection_comment?: string;
  reviewed_by_user_id?: string;
  reviewed_by_user_name?: string;
  reviewed_at?: string;
  round_history?: AttributeRoundHistory[];
}
export interface AttributeRoundHistory {
  round: number;
  values: ItemAttributeValue[];
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejection_comment?: string;
  reviewed_by_user_name?: string;
  timestamp: string;
}

export interface SubmissionAuditLog {
  id: string;
  round: number;
  actor_id: string;
  actor_name: string;
  action:
    | "CREATED_DRAFT"
    | "SUBMITTED"
    | "ATTRIBUTE_APPROVED"
    | "ATTRIBUTE_REJECTED"
    | "REQUESTED_REVISION"
    | "RESUBMITTED"
    | "FINAL_APPROVED"
    | "PUBLISHED";
  notes?: string;
  timestamp: string;
}

export type AttributeType = "SYSTEM" | "CUSTOM";

export interface ItemAttributeValue {
  id?: string;
  name: string;
  value?: string;
  label?: string;
}
