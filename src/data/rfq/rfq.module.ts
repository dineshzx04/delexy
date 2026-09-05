import type { PartyOwnerType } from "../business/business.module";

export type AttributeType = "SYSTEM" | "CUSTOM";

// ============================================================================
// SECTION 1: CORE DATABASE TABLES / ENTITIES (Persisted in Dexie DB)
// ============================================================================

export interface Rfq {
  id: string;
  rfq_number: string;
  title: string;
  description?: string;
  status: RfqStatus;
  requester_id: string;
  requester_name: string;
  requester_party_id?: string;
  requester_party_type?: PartyOwnerType;
  created_by_user_id?: string;
  contact_email?: string;
  contact_phone?: string;
  shipping_destination?: string;
  submission_deadline: string;
  currency?: string;
  created_at: string;
  updated_at: string;
}

export interface RfqItem {
  id: string;
  rfq_id: string;
  category_id: string;
  catalog_product_id: string;
  product_id: string | null;
  variant_id: string | null;
  item_index?: number;
  // req_unit_price: number;
  req_quantity: number;
  req_unit?: string;
  // awarded_quantity_total?: number;
  created_at: string;
  updated_at: string;
  status: RfqItemStatus;
  seller_assignments?: SellerAssignment[];
}

export interface RfqItemAttribute {
  id: string;
  rfq_item_id: string;
  attribute_type?: AttributeType;
  group_id: string;
  attribute_id: string;
  // is_variant: boolean;
  description?: string;
  unit?: string;
  connector: RfqItemAttributeConnector;
  values: ItemAttributeValue[];
  created_at: string;
  updated_at: string;
}

export interface SellerQuote {
  id: string;
  rfq_item_id: string;
  round: number; // Proposal Revision Round (1, 2, 3...)
  award_round?: number; // Award Allocation Revision Round (1, 2, 3...)
  seller_party_id: string;
  seller_quote_number: string;
  // offer_unit_price: number;
  offer_quantity: number;
  offer_unit?: string;
  status: SellerQuoteStatus;
  created_at: string;
  updated_at: string;
  draft_snapshot?: string | null;
}

export interface SellerQuoteAttribute {
  id: string;
  seller_quote_id: string;
  attribute_type?: AttributeType;
  group_id: string;
  attribute_id: string;
  is_variant: boolean;
  req_value: ItemAttributeValue[];
  values: ItemAttributeValue[];
  is_deviation: boolean;
  deviation_note?: string;
  buyer_accepted?: boolean;
  connector?: RfqItemAttributeConnector;
}

export interface SellerQuoteVariant {
  id: string;
  seller_quote_id: string;
  is_default: boolean;
  offer_price: number;
  buyer_accepted?: boolean;
  combinations: VariantCombination[];
  product_attributes?: any[];
  catalog_variant_id?: string;
  sku?: string;
  signature?: string;
  is_selected?: boolean;
}

export interface SellerQuoteSuggestedVariant {
  id: string;
  seller_quote_id: string;
  seller_product_id: string;
  variant_id: string;
  sku: string;
  list_price: number;
  offer_price: number;
  combinations?: VariantCombination[];
  specifications?: any[];
  is_selected: boolean;
  buyer_accepted?: boolean;
}

export interface SellerQuoteAttributeComment {
  id: string;
  seller_quote_id: string;
  round: number;
  attribute_type?: AttributeType;
  group_id: string;
  attribute_id: string;
  comment: string;
  actor_type: "BUYER" | "SELLER";
  actor_id: string;
  created_at: string;
}

export interface SellerQuoteVariantComment {
  id: string;
  seller_quote_id: string;
  round: number;
  variant_id: string;
  variant_type?: "CUSTOM" | "SUGGESTED";
  comment: string;
  actor_type: "BUYER" | "SELLER";
  actor_id: string;
  created_at: string;
}

export type SellerQuoteComment = SellerQuoteAttributeComment;

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

export type RfqQuoteAwardStatus =
  | "DRAFT"
  | "AWARDED"
  | "REVISION_REQUESTED"
  | "SELLER_REVISED"
  | "CONFIRMED"
  | "PO_CREATED"
  | "PO_RECEIVED"
  | "AWARD_FINALIZED"
  | "PO_GENERATED"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

export type RfqQuoteVariantAwardStatus =
  | "DRAFT"
  | "ALLOCATED"
  | "REVISION_REQUESTED"
  | "SELLER_REVISED"
  | "CONFIRMED"
  | "REJECTED"
  | "PO_CREATED";

/**
 * Commercial award commitment granted to a specific SellerQuote.
 * Supports split awards per RFQ item, independent round negotiations,
 * and clean 1:1 lineage to Purchase Orders.
 */
export interface RfqQuoteAward {
  id: string;
  rfq_id: string;
  rfq_item_id: string;
  seller_quote_id: string;
  seller_party_id: string;
  buyer_party_id: string;
  created_by_user_id?: string;
  award_status: RfqQuoteAwardStatus;
  award_round: number;
  total_awarded_amount: number;
  total_awarded_quantity: number;
  currency?: string;
  payment_terms?: string;
  shipping_address?: string;
  notes?: string;
  buyer_revision_note?: string;
  seller_response_note?: string;
  purchase_order_id?: string | null;
  draft_snapshot?: string | null;
  awarded_at?: string;
  seller_accepted_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Awarded commercial variant belonging to a specific RfqQuoteAward.
 * Models awarded quantity, pricing, round status, and catalog mapping status.
 */
export interface RfqQuoteVariantAward {
  id: string;
  quote_award_id: string;
  rfq_id: string;
  rfq_item_id: string;
  seller_quote_id: string;
  seller_party_id: string;
  variant_id: string;
  variant_type: "CUSTOM" | "SUGGESTED";
  variant_label?: string;
  sku?: string;
  excel_letter?: string;

  // 2-Tier Round Architecture & Negotiation
  award_round: number;
  buyer_target_quantity?: number;
  seller_offered_quantity?: number;
  awarded_quantity: number;
  unit_price: number;
  total_price: number;
  unit_of_measure?: string;

  // Lifecycle & Status
  variant_award_status: RfqQuoteVariantAwardStatus;
  seller_accepted: boolean;
  seller_accepted_at?: string;
  buyer_accepted?: boolean;
  buyer_accepted_at?: string;

  // Catalog Product Mapping Integration
  product_mapping_status?: ProductMappingStatus;
  mapped_seller_product_id?: string;
  mapped_catalog_variant_id?: string;

  // Notes & Audit
  buyer_revision_note?: string;
  seller_response_note?: string;
  purchase_order_id?: string | null;
  purchase_order_item_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AwardRevisionHistory {
  id: string;
  quote_award_id?: string;
  quote_variant_award_id?: string;
  rfq_id: string;
  rfq_item_id: string;
  seller_party_id: string;
  seller_quote_id: string;
  award_round: number;
  actor_type: "BUYER" | "SELLER";
  actor_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  note?: string;
  created_at: string;
}

export type PoStatus =
  | "DRAFT"
  | "RELEASED"
  | "SELLER_ACKNOWLEDGED"
  | "COMPLETED"
  | "CANCELLED";

export interface PurchaseOrder {
  id: string;
  po_number: string;
  rfq_id: string;
  quote_award_id?: string;
  buyer_party_id: string;
  seller_party_id: string;
  total_amount: number;
  currency: string;
  po_status: PoStatus;
  shipping_address?: string;
  payment_terms?: string;
  delivery_notes?: string;
  issued_by_user_id?: string;
  po_released_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  quote_variant_award_id?: string;
  rfq_item_id: string;
  variant_id: string;
  variant_label?: string;
  unit_price: number;
  awarded_quantity: number;
  unit_of_measure?: string;
  total_price: number;
}

export interface PoAcknowledgement {
  id: string;
  purchase_order_id: string;
  seller_party_id: string;
  seller_acknowledged: boolean;
  seller_acknowledged_at?: string;
  seller_note?: string;
  buyer_confirmed: boolean;
  buyer_confirmed_at?: string;
  buyer_note?: string;
  updated_at: string;
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
  | "ISSUED" // Sellers can respond
  | "IN_PROGRESS" // Active response period
  | "EVALUATING" // Buyer is comparing/selecting
  | "AWARDED" // Award decision made
  | "CLOSED" // Process completed
  | "CANCELLED";

export type RfqItemStatus = "OPEN" | "AWARDED" | "CANCELLED";

export interface SellerAssignment {
  rfq_item_id: string;
  seller_party_id: string;
  assignment_type: "DIRECT_INVITATION" | "PUBLIC_MARKETPLACE";
  assigned_by_user_id: string;
  assigned_at: string;
}

export interface ItemAttributeValue {
  value_id: string;
  value_label: string;
}

export type SellerQuoteStatus =
  | "NOT_SUBMITTED"
  | "DRAFT"
  | "SUBMITTED"
  | "REVISION_REQUIRED"
  | "DEVIATION_ACCEPTED"
  | "PRODUCT_SUBMIT_REVISION"
  | "FINAL_ACKNOWLEDGE"
  | "FINAL_ACKNOWLEDGE_REQUESTED"
  | "FINAL_ACKNOWLEDGE_ACCEPTED"
  | "REJECTED";


export type AwardStatus =
  | "AWARDED"
  | "CANCELLED"
  | "PO_CREATED"
  | "PO_RECEIVED";

export type ProductMappingStatus =
  | "NOT_REQUIRED"
  | "PENDING"
  | "SUBMITTED"
  | "ACKNOWLEDGED";

export type RfqItemAttributeConnector = "AND" | "OR";


interface VariantCombination {
  group_id: string;
  attribute_id: string;
  value_id: string
  [key: string]: any;
}