import type { PartyOwnerType } from '../business/business.module';

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
  event_type: 'CREATED' | 'ISSUED' | 'ITEM_ADDED' | 'SELLER_ASSIGNED' | 'TECHNICAL_RESPONSE_SUBMITTED' | 'REVISION_REQUESTED' | 'TECHNICAL_APPROVED' | 'PRODUCT_MAPPED' | 'COMMERCIAL_NEGOTIATED' | 'AWARDED' | 'PO_CREATED';
  actor_name: string;
  actor_id: string;
  timestamp: string;
  remarks?: string;
}

// =============================================================
// 2. RFQ HEADER CONTAINER
// =============================================================

export type RfqStatus = 
  | 'DRAFT'
  | 'ISSUED'               // Active sourcing container published to suppliers
  | 'UNDER_EVALUATION'     // Items are actively under technical or commercial evaluation
  | 'PARTIALLY_AWARDED'    // Some items awarded, others still under negotiation/open
  | 'FULLY_AWARDED'        // All items in the container 100% awarded
  | 'CLOSED'
  | 'CANCELLED';

export interface Rfq {
  id: string;                          // e.g. 'rfq-2026-1001'
  rfq_number: string;                  // e.g. 'RFQ-2026-1001'
  title: string;                       // RFQ Title
  description?: string;
  
  requester_party_id: string;          // Party ID ('pty-1' for Business or 'pty-6' for Individual)
  requester_party_type: PartyOwnerType;// 'BUSINESS' | 'USER'
  requester_name: string;              // Business display name or User full name
  created_by_user_id: string;          // User ID ('usr-2')

  contact_email: string;
  contact_phone?: string;
  shipping_destination: string;

  status: RfqStatus;
  submission_deadline: string;        // ISO Date String
  
  total_items_count: number;           // Can scale 1..1000+ items
  total_estimated_budget?: number;
  currency: string;                    // 'USD'

  attachments: RfqAttachment[];
  timeline: RfqTimelineEvent[];

  created_at: string;
  updated_at: string;
}

// =============================================================
// 3. RFQ LINE ITEM & SELLER ASSIGNMENT
// =============================================================

export type RfqItemStatus = 
  | 'OPEN'                     // Item issued & accepting/evaluating supplier responses
  | 'PARTIALLY_AWARDED'        // Partial split quantity awarded (e.g., 60 of 100 units)
  | 'FULLY_AWARDED'            // 100% requested quantity awarded across winning suppliers
  | 'CANCELLED';

export interface ManufacturingInput {
  field_id: string;                    // e.g. 'tolerance_specs', 'surface_finish', 'heat_treatment'
  field_name: string;                  // Human label e.g. 'Tolerance', 'Surface Finish'
  value: string | number;              // e.g. "±0.03 mm", "Ra 1.6"
}

export interface RfqItemDynamicAttribute {
  group_id: string;                    // AttributeGroup.id ('grp-4')
  attribute_id: string;                // Attribute.id ('attr-7')
  selected_value_ids: string[];        // AttributeValue.id[] (['val-7-1'])
}

export interface SellerAssignment {
  id: string;                          // e.g. 'sa-101'
  rfq_item_id: string;                 // Foreign key to RfqItem.id
  seller_party_id: string;             // Seller Party ID ('pty-4', 'pty-5')
  assignment_type: 'DIRECT_INVITATION' | 'PUBLIC_MARKETPLACE';
  assigned_by_user_id: string;
  assigned_at: string;
  status: 'ASSIGNED' | 'VIEWED' | 'RESPONDED' | 'DECLINED';
}

export type RfqItemSource = 'CATALOG_PRODUCT_VARIANT' | 'CUSTOM_REQUIREMENTS';

export interface RfqItem {
  id: string;                          // e.g. 'rfqi-101'
  rfq_id: string;                      // Foreign key to Rfq.id ('rfq-2026-1001')
  item_index: number;                  // 1..1000+ position
  status: RfqItemStatus;               // Item-level sourcing status
  item_source?: RfqItemSource;          // Computed: 'CATALOG_PRODUCT_VARIANT' | 'CUSTOM_REQUIREMENTS'
  
  category_id: string;                 // Leaf Category ID ('c-3-1-1')
  catalog_product_id?: string | null;  // Master Product Template ID ('prod-2')
  seller_product_id?: string | null;   // Seller Product ID e.g. 'sprod-1'
  variant_id?: string | null;          // Seller Product Variant ID e.g. 'sprod-1-v1'
  variant_sku?: string | null;         // Variant SKU e.g. 'SM-S928B-BLK-512'
  product_name: string;                // Item Title / Name
  brand_id?: string | null;            // Preferred Brand ID ('brd-1')
  manufacturer_id?: string | null;     // Preferred Manufacturer ID ('mfg-1')

  manufacturing_inputs: ManufacturingInput[];
  height?: string;
  width?: string;
  length?: string;
  weight?: string;

  // Quantity Requirements & Award Tracking
  quantity: number;                    // Required total qty e.g. 100
  awarded_quantity_total?: number;     // Sum of split awarded quantities (e.g. 100)
  unit_of_measure: string;             // 'Units', 'Pieces', 'Kg'
  target_unit_price?: number;          // Target budget price

  // Category Dynamic Attributes
  dynamic_attributes: RfqItemDynamicAttribute[];

  // Attachments & Seller Assignments
  attachments: RfqAttachment[];
  target_seller_party_ids?: string[];   // Assigned seller parties (empty array = Open RFQ)
  seller_assignments: SellerAssignment[];

  created_at: string;
  updated_at: string;
}

// =============================================================
// 4. ITEM-SUPPLIER RESPONSE (Per Item × Seller Transaction Record)
// =============================================================

export type ItemSupplierResponseStatus = 
  | 'ASSIGNED'
  | 'VIEWED'
  | 'TECHNICAL_SUBMITTED'
  | 'TECHNICAL_REVISION_REQUESTED'
  | 'TECHNICAL_APPROVED'
  | 'PRODUCT_MAPPED'
  | 'COMMERCIAL_UNDER_NEGOTIATION'
  | 'COMMERCIAL_FINALIZED'
  | 'AWARDED'
  | 'REJECTED';

export interface TechnicalAttributeResponse {
  attribute_key: string;               // e.g. 'attr-7' or 'tolerance_specs'
  attribute_name: string;              // Human label e.g. 'Operating Voltage' or 'Tolerance'
  requested_value: any;                // Value requested by buyer
  offered_value: any;                  // Value offered by supplier
  is_deviated: boolean;                // true if offered_value !== requested_value
  deviation_reason?: string;           // Remarks e.g. "Equivalent grade SS316"
}

export interface TechnicalRevisionRound {
  round_number: number;
  submitted_by_user_id: string;
  submitted_at: string;
  buyer_requirement_snapshot: TechnicalAttributeResponse[];
  supplier_response: TechnicalAttributeResponse[];
  buyer_review_notes?: string;
  round_status: 'PENDING' | 'REVISION_REQUESTED' | 'APPROVED';
}

export interface ProductMapping {
  seller_product_id: string;           // Mapped Catalog Product ID ('sprod-1')
  variant_id: string;                  // Mapped Variant ID ('sprod-1-v2')
  mapped_at: string;
  is_buyer_approved: boolean;
}

export interface CommercialTerms {
  offered_unit_price: number;
  discount_percent?: number;
  lead_time_days: number;
  moq: number;                         // Minimum Order Quantity
  payment_terms: string;               // e.g. "Net 30 Days"
  freight_terms: string;               // e.g. "FOB Origin"
  warranty_terms: string;              // e.g. "2 Years Factory Warranty"
  total_commercial_amount: number;     // (offered_unit_price * offered_quantity)
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
  po_id: string;                       // e.g. 'po-2026-801'
  po_number: string;                   // e.g. 'PO-2026-801'
  status: 'ISSUED' | 'ACCEPTED' | 'DELIVERED';
}

export interface ItemSupplierResponse {
  id: string;                          // e.g. 'isr-501'
  assignment_id: string;               // Foreign key to SellerAssignment.id
  rfq_id: string;                      // Foreign key to Rfq.id ('rfq-2026-1001')
  rfq_item_id: string;                 // Foreign key to RfqItem.id ('rfqi-101')
  
  seller_party_id: string;             // Responding Seller Party ID ('pty-4' Sony Corp)
  seller_party_name: string;           // 'Sony Corporation Global Party'
  supplier_user_id: string;            // Responding Supplier User ID ('usr-3' Sarah Smith)

  status: ItemSupplierResponseStatus;
  current_technical_round: number;

  // Technical Revisions (Phases 3-5)
  technical_revision_rounds: TechnicalRevisionRound[];

  // Product Mapping (Phase 6 - After Tech Approval)
  product_mapping: ProductMapping | null;

  // Commercial Negotiation Rounds (Phase 7)
  commercial_terms?: CommercialTerms;
  commercial_negotiation_rounds: CommercialNegotiationRound[];

  // Multi-Supplier Award & Purchase Order (Phases 8-9)
  is_awarded: boolean;
  awarded_quantity?: number;
  awarded_unit_price?: number;
  awarded_total_amount?: number;
  awarded_at?: string;
  purchase_order?: PurchaseOrderRef | null;

  created_at: string;
  updated_at: string;
}

// =============================================================
// 5. MULTI-SELLER SPLIT AWARD ENTITY (Phase 8)
// =============================================================

export interface RfqItemAward {
  id: string;                          // e.g. 'award-801'
  rfq_id: string;                      // 'rfq-2026-1001'
  rfq_item_id: string;                 // 'rfqi-101'
  item_supplier_response_id: string;   // Winning ItemSupplierResponse.id ('isr-501')
  
  seller_party_id: string;             // Winning Seller Party ID ('pty-4')
  seller_product_id: string;           // Mapped Product ID ('sprod-1')
  variant_id: string;                  // Mapped Variant ID ('sprod-1-v2')

  awarded_quantity: number;            // Split quantity e.g. 60 units
  awarded_unit_price: number;          // e.g. $1,000/unit
  awarded_total_amount: number;        // e.g. $60,000
  currency: string;                    // 'USD'

  awarded_by_user_id: string;          // Buyer User ID ('usr-2')
  awarded_at: string;
  
  status: 'AWARDED' | 'PURCHASE_ORDER_GENERATED';
  purchase_order_id?: string;
}
