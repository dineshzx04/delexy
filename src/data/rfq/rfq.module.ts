import type { PartyOwnerType } from "../business/business.module";

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
  attachments?: RfqAttachment[];
  timeline?: RfqTimelineEvent[];
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
  seller_product_id?: string | null;
  variant_id?: string | null;
  variant_sku?: string | null;
  product_name?: string;
  brand_id?: string | string[] | null;
  manufacturer_id?: string | string[] | null;
  target_unit_price?: number;
  awarded_quantity_total?: number;
  dynamic_attributes?: RfqItemDynamicAttribute[];
  attachments?: RfqAttachment[];
  target_seller_party_ids: string[];
  seller_assignments?: SellerAssignment[];
}

export interface RfqItemAttribute {
  id: string;
  rfq_item_id: string;
  group_id: string;
  attribute_id: string;
  attribute_name: string;
  description: string;
  values: ItemAttributeValue[];
}

export interface SellerQuote {
  id: string;
  rfq_item_id: string;
  seller_id: string;
  status: SellerQuoteStatus;
  current_revision_id?: string | null;
  created_at: string;
  updated_at: string;
  unit_price: number;
  seller_product_mapping?: {
    seller_product_id: string;
    variant_id: string;
    mapped_at: string;
    is_buyer_approved: boolean;
  } | null;
}

export interface SellerQuoteRevision {
  id: string;
  seller_quote_id: string;
  rfq_item_id: string;
  revision_number: number;
  created_by: string;
  created_at: string;
}

export interface SellerQuoteAttribute {
  id: string;
  quote_revision_id: string;
  item_attribute_id: string;
  group_id: string;
  attribute_id: string;
  attribute_name: string;
  offered_values: ItemAttributeValue[];
}

export interface SellerQuoteComment {
  id: string;
  seller_quote_id: string;
  quote_attribute_id?: string | null;
  comment: string;
  sender: "BUYER" | "SELLER";
  sender_id: string;
  created_at: string;
}

export interface ItemAttributeChangeHistory {
  id: string;
  rfq_item_id: string;
  item_revision?: number;
  seller_quote_id?: string | null;
  round?: number | null;
  group_id: string;
  attribute_id: string;
  attribute_name?: string;
  value_type?: string;
  actor_type: "BUYER" | "SELLER" | "SYSTEM";
  actor_id: string;
  old_value?: ItemAttributeValue[] | null;
  new_value?: ItemAttributeValue[] | null;
  change_reason?: string;
  timestamp?: string;
  archived_at?: string;
}

export interface RfqAward {
  id: string;
  rfq_id: string;
  rfq_item_id: string;
  seller_party_id: string;
  awarded_quantity: number;
  unit_price: number;
  awarded_at: string;
  currency?: string;
  status?: AwardItemStatus;
  purchase_order_id?: string;
  seller_product_id?: string;
  variant_id?: string;
  awarded_by_user_id?: string;
}


// ============================================================================
// SECTION 2: NESTED SUB-STRUCTURES, LIFECYCLE ENUMS & VALUE OBJECTS
// ============================================================================

export interface RfqAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  file_size?: string;
  uploaded_at: string;
}

export interface RfqTimelineEvent {
  id: string;
  rfq_id: string;
  event_type:
    | "CREATED"
    | "ISSUED"
    | "ITEM_ADDED"
    | "SELLER_ASSIGNED"
    | "TECHNICAL_RESPONSE_SUBMITTED"
    | "REVISION_REQUESTED"
    | "TECHNICAL_APPROVED"
    | "PRODUCT_MAPPED"
    | "COMMERCIAL_NEGOTIATED"
    | "AWARDED"
    | "PO_CREATED";
  actor_name: string;
  actor_id: string;
  timestamp: string;
  remarks?: string;
}

export type RfqStatus =
  | "DRAFT"
  | "ISSUED"
  | "PUBLISHED"
  | "UNDER_EVALUATION"
  | "RESPONSES_RECEIVED"
  | "NEGOTIATION"
  | "AWARD_PENDING"
  | "PARTIALLY_AWARDED"
  | "FULLY_AWARDED"
  | "CLOSED"
  | "CANCELLED"
  | "IN_PROGRESS"
  | "AWARDED";

export type RfqItemStatus =
  | "OPEN"
  | "PARTIALLY_AWARDED"
  | "FULLY_AWARDED"
  | "CANCELLED";

export interface RfqItemDynamicAttribute {
  group_id: string;
  attribute_id: string;
  selected_value_ids: string[];
}

export interface SellerAssignment {
  id: string;
  rfq_item_id: string;
  seller_party_id: string;
  assignment_type: "DIRECT_INVITATION" | "PUBLIC_MARKETPLACE";
  assigned_by_user_id: string;
  assigned_at: string;
  status: "ASSIGNED" | "VIEWED" | "RESPONDED" | "DECLINED";
}

export type RfqItemSource = "CATALOG_PRODUCT_VARIANT" | "CUSTOM_REQUIREMENTS";

export interface ItemAttributeValue {
  value_id: string;
  value_label: string;
}

export type SellerQuoteStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "NEGOTIATION"
  | "REVISED"
  | "ACCEPTED"
  | "PARTIALLY_ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "WITHDRAWN";

export type AwardItemStatus =
  | "PENDING"
  | "AWARDED"
  | "PRODUCT_PENDING"
  | "PRODUCT_SUBMITTED"
  | "PRODUCT_APPROVED"
  | "BUYER_ACKNOWLEDGED"
  | "PO_CREATED"
  | "CANCELLED";

export type ItemSupplierResponseStatus =
  | "ASSIGNED"
  | "VIEWED"
  | "TECHNICAL_SUBMITTED"
  | "TECHNICAL_REVISION_REQUESTED"
  | "TECHNICAL_APPROVED"
  | "PRODUCT_MAPPED"
  | "COMMERCIAL_UNDER_NEGOTIATION"
  | "COMMERCIAL_FINALIZED"
  | "AWARDED"
  | "REJECTED";


// ============================================================================
// SECTION 3: UI / DERIVED / RESPONSE VIEW MODELS (API & Presentation Layer)
// ============================================================================

export interface AttributeCommentEntry {
  id: string;
  sender_role: "BUYER" | "SELLER";
  sender_name: string;
  sender_user_id: string;
  comment: string;
  timestamp: string;
}

export interface TechnicalAttributeResponse {
  attribute_key: string;
  attribute_name: string;
  requested_value: any;
  offered_value: any;
  is_deviated: boolean;
  deviation_reason?: string;
  buyer_status?: "APPROVED" | "REVISION_REQUESTED" | "REJECTED";
  buyer_comment?: string;
  seller_comment?: string;
  comment_history?: AttributeCommentEntry[];
}

export interface TechnicalRevisionRound {
  round_number: number;
  submitted_by_user_id: string;
  submitted_at: string;
  buyer_requirement_snapshot: TechnicalAttributeResponse[];
  supplier_response: TechnicalAttributeResponse[];
  buyer_review_notes?: string;
  buyer_reviewed_at?: string;
  buyer_reviewed_by_user_id?: string;
  round_status: "PENDING" | "REVISION_REQUESTED" | "APPROVED" | "REJECTED";
}

export interface ProductMapping {
  seller_product_id: string;
  variant_id: string;
  mapped_at: string;
  is_buyer_approved: boolean;
}

export interface CommercialTerms {
  offered_unit_price: number;
  discount_percent?: number;
  lead_time_days: number;
  moq: number;
  payment_terms: string;
  freight_terms: string;
  warranty_terms: string;
  total_commercial_amount: number;
}

export interface CommercialNegotiationRound {
  round_number: number;
  sender_party_id: string;
  sender_user_id: string;
  sender_name: string;
  unit_price: number;
  quantity: number;
  discount_percent?: number;
  lead_time_days?: number;
  payment_terms?: string;
  freight_terms?: string;
  warranty_terms?: string;
  remarks?: string;
  timestamp: string;
}

export interface PurchaseOrderRef {
  po_id: string;
  po_number: string;
  status: "ISSUED" | "ACCEPTED" | "DELIVERED";
}

export interface ItemSupplierResponse {
  id: string;
  assignment_id: string;
  rfq_id: string;
  rfq_item_id: string;
  seller_party_id: string;
  seller_party_name: string;
  supplier_user_id: string;
  status: ItemSupplierResponseStatus;
  current_technical_round: number;
  technical_revision_rounds: TechnicalRevisionRound[];
  product_mapping: ProductMapping | null;
  commercial_terms?: CommercialTerms;
  commercial_negotiation_rounds: CommercialNegotiationRound[];
  is_awarded: boolean;
  awarded_quantity?: number;
  awarded_unit_price?: number;
  awarded_total_amount?: number;
  awarded_at?: string;
  purchase_order?: PurchaseOrderRef | null;
  created_at: string;
  updated_at: string;
}
