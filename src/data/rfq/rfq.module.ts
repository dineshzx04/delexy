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
  round: number;
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
  option_type?: 'CUSTOM_GENERATED' | 'CATALOG_SKU';
  catalog_variant_id?: string;
  sku?: string;
  satisfaction_status?: 'SATISFIED' | 'CUSTOM';
  signature?: string;
  is_selected?: boolean;
  seller_note?: string;
  buyer_note?: string;
}

export interface SellerQuoteComment {
  id: string;
  seller_quote_id: string;
  round: number
  attribute_type?: AttributeType;
  group_id: string;
  attribute_id: string;
  comment: string;
  actor_type: "BUYER" | "SELLER";
  actor_id: string;
  created_at: string;
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

// export interface RfqAward {
//   id: string;
//   rfq_id: string;
//   rfq_item_id: string;
//   seller_quote_id: string;
//   seller_party_id: string;
//   awarded_quantity: number;
//   variant_id: string;
//   offered_variant_id: string | null;
//   unit_price: number;
//   currency?: string;
//   award_status: AwardStatus;
//   product_mapping_status: ProductMappingStatus;
//   purchase_order_id?: string;
//   awarded_at: string;
//   awarded_by_user_id?: string;

//   // Metadata details for PO release & receipt
//   shipping_address?: string;
//   payment_terms?: string;
//   delivery_notes?: string;
//   po_released_at?: string;
//   po_received_at?: string;
//   supplier_acknowledgement_note?: string;
// }

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
  | "REJECTED";

export type AwardItemStatus =
  | "AWARDED"
  | "PRODUCT_PENDING"
  | "PRODUCT_SUBMITTED"
  | "PRODUCT_ACKNOWLEDGED"
  | "PO_CREATED"
  | "CANCELLED";

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