import type { PartyOwnerType } from "../business/business.module";

// =============================================================
// 1. ATTACHMENT & TIMELINE ENTITIES
// =============================================================

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

// =============================================================
// 2. RFQ HEADER CONTAINER
// =============================================================

export type RfqStatus =
  | "DRAFT"
  | "ISSUED" // Active sourcing container published to suppliers
  | "UNDER_EVALUATION" // Items are actively under technical or commercial evaluation
  | "PARTIALLY_AWARDED" // Some items awarded, others still under negotiation/open
  | "FULLY_AWARDED" // All items in the container 100% awarded
  | "CLOSED"
  | "CANCELLED"
  | "IN_PROGRESS" // Added for agent flow
  | "AWARDED"; // Added for agent flow

export interface Rfq {
  id: string; // e.g. 'rfq-01' or 'rfq-2026-1001'
  status: RfqStatus;
  createdAt?: string; // ISO Date String
  created_at?: string; // compatibility

  // Optional fields from legacy Rfq for compatibility
  rfq_number: string;
  title: string;
  description?: string;
  requester_party_id?: string;
  requester_party_type?: PartyOwnerType;
  requester_name: string;
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
  updated_at?: string;
}

// =============================================================
// 3. RFQ LINE ITEM & SELLER ASSIGNMENT
// =============================================================

export type RfqItemStatus =
  | "OPEN" // Item issued & accepting/evaluating supplier responses
  | "PARTIALLY_AWARDED" // Partial split quantity awarded
  | "FULLY_AWARDED" // 100% requested quantity awarded
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

export interface RfqItem {
  id: string; // e.g. 'item-01' or 'rfqi-101'
  rfq_id?: string; // compatibility
  itemRevision?: number; // Buyer-led item revision/version
  category_id?: string; // compatibility
  quantity: number;
  unit_price?: number;
  unit?: string; // new

  // Optional/Required fields from legacy RfqItem for compatibility
  item_index?: number;
  status: RfqItemStatus;
  item_source?: RfqItemSource;
  catalog_product_id?: string | null;
  seller_product_id?: string | null;
  variant_id?: string | null;
  variant_sku?: string | null;
  product_name?: string;
  brand_id?: string | string[] | null;
  manufacturer_id?: string | string[] | null;
  unit_of_measure?: string;
  target_unit_price?: number;
  awarded_quantity_total?: number;
  dynamic_attributes?: RfqItemDynamicAttribute[];
  attachments?: RfqAttachment[];
  target_seller_party_ids: string[];
  seller_assignments?: SellerAssignment[];
  created_at?: string;
  updated_at?: string;
}

// =============================================================
// 4. ITEM SPECIFICATIONS / ATTRIBUTES
// =============================================================

export interface ItemAttributeValue {
  valueId: string;
  valueLabel: string;
}

export interface ItemAttribute {
  id: string; // Unique attribute config ID (e.g. 'ia-01')
  itemId: string;
  groupId: string;
  attributeId: string;
  attributeName: string;
  description: string;
  currentBuyerValues: ItemAttributeValue[];
}

// =============================================================
// 5. SELLER QUOTATION & ACTIVE RESPONSES
// =============================================================

export type SellerQuoteStatus = "DRAFT" | "SUBMITTED" | "FINALIZED";

export interface SellerQuote {
  id: string; // Quote ID (e.g. 'q-001')
  itemId: string;
  sellerId: string;
  itemRevision: number;
  round: number;
  unit_price: number;
  status: SellerQuoteStatus;
  sellerProductMapping?: {
    seller_product_id: string;
    variant_id: string;
    mapped_at: string;
    is_buyer_approved: boolean;
  } | null;
}

export interface SellerAttributeResponse {
  id: string; // Response ID (e.g. 'resp-001')
  quoteId: string;
  groupId: string;
  attributeId: string;
  buyerValue: ItemAttributeValue[];
  value: ItemAttributeValue[];
}

// =============================================================
// 6. COMMENTS / NEGOTIATION THREADS
// =============================================================

export interface AttributeComment {
  id: string; // Comment ID (e.g. 'c-001')
  quoteId: string;
  groupId: string;
  attributeId: string;
  round: number;
  senderType: "BUYER" | "SELLER";
  senderId: string;
  comment: string;
  createdAt: string;
}

// =============================================================
// 7. RESPONSE HISTORY (AUDIT TRAIL)
// =============================================================

export interface AttributeResponseHistory {
  id: string; // History ID (e.g. 'hist-001')
  responseId: string;
  quoteId: string;
  round: number;
  groupId: string;
  attributeId: string;
  buyerValue: ItemAttributeValue[];
  value: ItemAttributeValue[];
  archivedAt: string;
}

// =============================================================
// 8. SPLIT AWARD DETAILS
// =============================================================

export interface RfqAward {
  id: string; // Award ID (e.g. 'awd-01')
  rfqId?: string;
  rfq_id?: string; // compatibility
  itemId?: string;
  rfq_item_id?: string; // compatibility
  sellerId?: string;
  seller_party_id?: string; // compatibility
  awardedQuantity?: number;
  awarded_quantity?: number; // compatibility
  unitPrice?: number;
  awarded_unit_price?: number; // compatibility
  awarded_total_amount?: number; // compatibility
  awardedAt?: string;
  awarded_at?: string; // compatibility
  currency?: string;
  status?: "AWARDED" | "PURCHASE_ORDER_GENERATED";
  purchase_order_id?: string;
  item_supplier_response_id?: string; // compatibility
  seller_product_id?: string; // compatibility
  variant_id?: string; // compatibility
  awarded_by_user_id?: string; // compatibility
}

// =============================================================
// 9. LEGACY TYPES FOR BACKWARD COMPATIBILITY
// =============================================================

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

export type RfqItemAward = RfqAward; // Alias for backward compatibility
