import type { ItemSupplierResponse } from './rfq.module';

export const mockItemSupplierResponses: ItemSupplierResponse[] = [
  // 1. Supplier A Response (Sony Corp pty-4 / Sarah Smith usr-3)
  {
    id: 'isr-501',
    assignment_id: 'sa-101',
    rfq_id: 'rfq-2026-1001',
    rfq_item_id: 'rfqi-101',
    
    seller_party_id: 'pty-4',             // Sony Corporation Global Party
    seller_party_name: 'Sony Corporation Global Party',
    supplier_user_id: 'usr-3',            // Sarah Smith

    status: 'AWARDED',
    current_technical_round: 1,

    // Technical Revision Rounds (Phases 3-5)
    technical_revision_rounds: [
      {
        round_number: 1,
        submitted_by_user_id: 'usr-3',
        submitted_at: '2026-08-02T09:00:00.000Z',
        buyer_requirement_snapshot: [
          {
            attribute_key: 'attr-7',
            attribute_name: 'Display Size',
            requested_value: 'val-7-1',
            offered_value: 'val-7-1',
            is_deviated: false,
          },
          {
            attribute_key: 'attr-9',
            attribute_name: 'Internal Storage',
            requested_value: 'val-9-1',
            offered_value: 'val-9-2',
            is_deviated: true,
            deviation_reason: '512GB Black variant out of stock. Offering upgraded 1TB UFS 4.0 at discounted rate.',
          }
        ],
        supplier_response: [
          {
            attribute_key: 'attr-7',
            attribute_name: 'Display Size',
            requested_value: 'val-7-1',
            offered_value: 'val-7-1',
            is_deviated: false,
          },
          {
            attribute_key: 'attr-9',
            attribute_name: 'Internal Storage',
            requested_value: 'val-9-1',
            offered_value: 'val-9-2',
            is_deviated: true,
            deviation_reason: '512GB Black variant out of stock. Offering upgraded 1TB UFS 4.0 at discounted rate.',
          }
        ],
        buyer_review_notes: '1TB Titanium specification approved technically by John Doe.',
        round_status: 'APPROVED',
      }
    ],

    // Product Mapping (Phase 6)
    product_mapping: {
      seller_product_id: 'sprod-1',
      variant_id: 'sprod-1-v2',           // 1TB Titanium SKU
      mapped_at: '2026-08-02T10:00:00.000Z',
      is_buyer_approved: true,
    },

    // Commercial Terms & Negotiation Rounds (Phase 7)
    commercial_terms: {
      offered_unit_price: 1000,
      discount_percent: 5,
      lead_time_days: 5,
      moq: 10,
      payment_terms: 'Net 30 Days',
      freight_terms: 'FOB Destination',
      warranty_terms: '2 Years Enterprise Warranty',
      total_commercial_amount: 60000,
    },
    commercial_negotiation_rounds: [
      {
        round_number: 1,
        sender_party_id: 'pty-4',
        sender_user_id: 'usr-3',
        sender_name: 'Sarah Smith (Sony Corp)',
        unit_price: 1050,
        quantity: 60,
        remarks: 'Initial commercial offer $1,050/unit for 60 units.',
        timestamp: '2026-08-02T10:30:00.000Z',
      },
      {
        round_number: 2,
        sender_party_id: 'pty-1',
        sender_user_id: 'usr-2',
        sender_name: 'John Doe (Samsung India)',
        unit_price: 1000,
        quantity: 60,
        remarks: 'Counter-offer $1,000/unit for 60 units.',
        timestamp: '2026-08-02T11:15:00.000Z',
      },
      {
        round_number: 3,
        sender_party_id: 'pty-4',
        sender_user_id: 'usr-3',
        sender_name: 'Sarah Smith (Sony Corp)',
        unit_price: 1000,
        quantity: 60,
        remarks: 'Agreed at $1,000/unit for 60 units.',
        timestamp: '2026-08-02T11:45:00.000Z',
      }
    ],

    // Multi-Supplier Award & Purchase Order (Phases 8-9)
    is_awarded: true,
    awarded_quantity: 60,
    awarded_unit_price: 1000,
    awarded_total_amount: 60000,
    awarded_at: '2026-08-02T12:00:00.000Z',
    purchase_order: {
      po_id: 'po-2026-801',
      po_number: 'PO-2026-801',
      status: 'ISSUED',
    },

    created_at: '2026-08-02T09:00:00.000Z',
    updated_at: '2026-08-02T12:00:00.000Z',
  },

  // 2. Supplier B Response (ASUSTeK pty-5 / Takeshi Kovacs usr-4)
  {
    id: 'isr-502',
    assignment_id: 'sa-102',
    rfq_id: 'rfq-2026-1001',
    rfq_item_id: 'rfqi-101',
    
    seller_party_id: 'pty-5',             // ASUSTeK Computer Inc Party
    seller_party_name: 'ASUSTeK Computer Inc Party',
    supplier_user_id: 'usr-4',            // Takeshi Kovacs

    status: 'AWARDED',
    current_technical_round: 1,

    technical_revision_rounds: [
      {
        round_number: 1,
        submitted_by_user_id: 'usr-4',
        submitted_at: '2026-08-02T09:30:00.000Z',
        buyer_requirement_snapshot: [
          {
            attribute_key: 'attr-7',
            attribute_name: 'Display Size',
            requested_value: 'val-7-1',
            offered_value: 'val-7-1',
            is_deviated: false,
          },
          {
            attribute_key: 'attr-9',
            attribute_name: 'Internal Storage',
            requested_value: 'val-9-1',
            offered_value: 'val-9-1',
            is_deviated: false,
          }
        ],
        supplier_response: [
          {
            attribute_key: 'attr-7',
            attribute_name: 'Display Size',
            requested_value: 'val-7-1',
            offered_value: 'val-7-1',
            is_deviated: false,
          },
          {
            attribute_key: 'attr-9',
            attribute_name: 'Internal Storage',
            requested_value: 'val-9-1',
            offered_value: 'val-9-1',
            is_deviated: false,
          }
        ],
        buyer_review_notes: 'Exact technical match approved.',
        round_status: 'APPROVED',
      }
    ],

    product_mapping: {
      seller_product_id: 'sprod-1',
      variant_id: 'sprod-1-v1',           // 512GB Black SKU
      mapped_at: '2026-08-02T10:15:00.000Z',
      is_buyer_approved: true,
    },

    commercial_terms: {
      offered_unit_price: 1050,
      discount_percent: 0,
      lead_time_days: 7,
      moq: 5,
      payment_terms: 'Net 30 Days',
      freight_terms: 'FOB Origin',
      warranty_terms: '1 Year Factory Warranty',
      total_commercial_amount: 42000,
    },
    commercial_negotiation_rounds: [
      {
        round_number: 1,
        sender_party_id: 'pty-5',
        sender_user_id: 'usr-4',
        sender_name: 'Takeshi Kovacs (ASUSTeK)',
        unit_price: 1050,
        quantity: 40,
        remarks: 'Commercial offer $1,050/unit for remaining 40 units.',
        timestamp: '2026-08-02T10:45:00.000Z',
      }
    ],

    is_awarded: true,
    awarded_quantity: 40,
    awarded_unit_price: 1050,
    awarded_total_amount: 42000,
    awarded_at: '2026-08-02T12:05:00.000Z',
    purchase_order: {
      po_id: 'po-2026-802',
      po_number: 'PO-2026-802',
      status: 'ISSUED',
    },

    created_at: '2026-08-02T09:30:00.000Z',
    updated_at: '2026-08-02T12:05:00.000Z',
  }
];
