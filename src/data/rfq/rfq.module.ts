import type { PartyOwnerType } from "../business/business.module";

export type AttributeType = "SYSTEM" | "CUSTOM";

// ============================================================================
// SECTION 1: CORE DATABASE TABLES / ENTITIES (Persisted in Dexie DB)
// ============================================================================

export interface Rfq {
  id: string;
  status: RfqStatus;
  requester_id: string;
  requester_name: string;
  requester_party_id?: string;
  created_at: string;
  updated_at: string;
  rfq_number: string;
  title: string;
  description?: string;
  requester_party_type?: PartyOwnerType;
  created_by_user_id?: string;
  contact_email?: string;
  contact_phone?: string;
  shipping_destination?: string;
  submission_deadline: string;
  total_items_count?: number;
  total_estimated_budget?: number;
  currency?: string;
}

export interface RfqItem {
  id: string;
  rfq_id: string;
  category_id: string;
  quantity: number;
  unit: string;
  item_index?: number;
  created_at: string;
  updated_at: string;
  status: RfqItemStatus;
  item_source?: RfqItemSource;
  catalog_product_id?: string | null;
  variant_id?: string | null;
  product_name?: string;
  brand_id?: string[] | null;
  manufacturer_id?: string[] | null;
  target_unit_price?: number;
  awarded_quantity_total?: number;
  seller_assignments?: SellerAssignment[];
}

export interface RfqItemAttribute {
  id: string;
  rfq_item_id: string;
  group_id: string;
  attribute_id: string;
  description?: string;
  values: ItemAttributeValue[];
  created_at: string;
  updated_at: string;
  attribute_type?: AttributeType;
}

export interface SellerQuote {
  id: string;
  rfq_item_id: string;
  seller_party_id: string;
  seller_quote_number: string;
  unit_price: number;
  round: number;
  status: SellerQuoteStatus;
  brand_id?: string[] | null;
  manufacturer_id?: string[] | null;
  created_at: string;
  updated_at: string;
  seller_product_mapping?: {
    seller_product_id: string;
    variant_id: string;
    mapped_at: string;
    is_buyer_approved: boolean;
  } | null;
  draft_snapshot?: string | null;
}

export interface SellerQuoteAttribute {
  id: string;
  seller_quote_id: string;
  group_id: string;
  attribute_id: string;
  offered_values: ItemAttributeValue[];
  attribute_type?: AttributeType;
}

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

// export interface ItemAttributeChangeHistory {
//   id: string;
//   rfq_item_id: string;
//   item_revision?: number;
//   seller_quote_id?: string | null;
//   round?: number | null;
//   group_id: string;
//   attribute_id: string;
//   attribute_name?: string;
//   value_type?: string;
//   actor_type: "BUYER" | "SELLER" | "SYSTEM";
//   actor_id: string;
//   old_value?: ItemAttributeValue[] | null;
//   new_value?: ItemAttributeValue[] | null;
//   change_reason?: string;
//   timestamp?: string;
//   archived_at?: string;
// }

export interface RfqAward {
  id: string;
  rfq_id: string;
  rfq_item_id: string;
  seller_quote_id: string;
  seller_party_id: string;
  awarded_quantity: number;
  unit_price: number;
  currency?: string;
  award_status: AwardStatus;
  product_mapping_status: ProductMappingStatus;
  purchase_order_id?: string;
  variant_id?: string;
  awarded_at: string;
  awarded_by_user_id?: string;

  // Metadata details for PO release & receipt
  shipping_address?: string;
  payment_terms?: string;
  delivery_notes?: string;
  po_released_at?: string;
  po_received_at?: string;
  supplier_acknowledgement_note?: string;
}

// ============================================================================
// SECTION 2: NESTED SUB-STRUCTURES, LIFECYCLE ENUMS & VALUE OBJECTS
// ============================================================================

// export interface RfqAttachment {
//   id: string;
//   file_name: string;
//   file_url: string;
//   file_type?: string;
//   file_size?: string;
//   uploaded_at: string;
// }

export type RfqStatus =
  | "DRAFT"
  | "ISSUED"
  | "IN_PROGRESS"
  | "CANCELLED"
  | "CLOSED";

export type RfqItemStatus = "OPEN" | "AWARDED" | "CANCELLED";

export interface SellerAssignment {
  id: string;
  rfq_item_id: string;
  seller_party_id: string;
  assignment_type: "DIRECT_INVITATION" | "PUBLIC_MARKETPLACE";
  assigned_by_user_id: string;
  assigned_at: string;
}

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

export type AwardItemStatus =
  | "AWARDED"
  | "PRODUCT_PENDING"
  | "PRODUCT_SUBMITTED"
  | "PRODUCT_ACKNOWLEDGED"
  | "PO_CREATED"
  | "CANCELLED";

export type AwardStatus = "AWARDED" | "CANCELLED" | "PO_CREATED" | "PO_RECEIVED";

export type ProductMappingStatus =
  | "NOT_REQUIRED"
  | "PENDING"
  | "SUBMITTED"
  | "ACKNOWLEDGED";
