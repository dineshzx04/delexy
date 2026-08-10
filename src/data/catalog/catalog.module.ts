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

export interface SellerProductVariant {
  id: string;                          // Seller Variant Local ID ('sprod-1-v1')
  variant_platform_id: string;         // Universal Platform Product ID ('gpid-10101')
  sku: string;                         // SKU code ('SM-S928B-BLK-512')
  price: number;
  currency: string;
  stock: number;
  min_order_quantity: number;
  combination_values: SellerProductVariantCombinationValue[];
}

export interface SellerProduct {
  id: string;                          // Unique Seller Product ID (e.g. 'sprod-1')
  category_id: string;                 // Leaf Category ID ('c-2-1-1')
  catalog_product_id: string;          // Master Catalog Product Template ID ('prod-1')
  product_name: string;                // Listing Title
  manufacturer_id?: string;            // Manufacturer Table ID ('mfg-1')
  brand_id?: string;                   // Brand ID ('brd-1')
  party_id: string;                    // Seller Party ID ('pty-1' or 'pty-6')

  dynamic_attributes: SellerProductAttributeSelection[];
  specifications: SellerProductSpecification[];
  variants: SellerProductVariant[];

  is_locked?: boolean;                 // Governance flag: true once platform IDs are assigned and specs are locked
  status: "ACTIVE" | "INACTIVE";
  created_at: string;
  updated_at: string;
}

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
  action: 'CREATED_DRAFT' | 'SUBMITTED' | 'ATTRIBUTE_APPROVED' | 'ATTRIBUTE_REJECTED' | 'REQUESTED_REVISION' | 'RESUBMITTED' | 'FINAL_APPROVED' | 'PUBLISHED';
  notes?: string;
  timestamp: string;
}

export interface SellerProductSubmission {
  id: string;
  party_id: string;
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

