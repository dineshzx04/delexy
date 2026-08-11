import type { Rfq } from './rfq.module';

export const mockRfqs: Rfq[] = [
  {
    id: "rfq-01",
    status: "IN_PROGRESS",
    requester_id: "pty-1",
    requester_name: "Samsung India Industrial Party",
    created_at: "2026-08-01T09:00:00Z",
    updated_at: "2026-08-02T12:05:00Z",
    rfq_number: "RFQ-2026-1001",
    title: "Q3 Corporate Smartphone Restock & Custom Equipment",
    description: "Bulk procurement of flagship mobile devices, gaming laptops, and athletic footwear.",
    requester_party_type: "BUSINESS",
    created_by_user_id: "usr-2",
    contact_email: "john.doe@samsung-india.com",
    contact_phone: "+91-9876543210",
    shipping_destination: "Samsung India HQ Facility, New Delhi, India",
    submission_deadline: "2026-08-30T23:59:59.000Z",
    total_items_count: 3,
    total_estimated_budget: 120000,
    currency: "USD",
    attachments: [],
    timeline: [
      {
        id: "ev-01",
        rfq_id: "rfq-01",
        event_type: "CREATED",
        actor_name: "John Doe",
        actor_id: "usr-2",
        timestamp: "2026-08-01T09:00:00Z",
        remarks: "RFQ drafted."
      },
      {
        id: "ev-02",
        rfq_id: "rfq-01",
        event_type: "ISSUED",
        actor_name: "John Doe",
        actor_id: "usr-2",
        timestamp: "2026-08-01T10:00:00Z",
        remarks: "RFQ issued to assigned suppliers."
      },
      {
        id: "ev-03",
        rfq_id: "rfq-01",
        event_type: "SELLER_ASSIGNED",
        actor_name: "John Doe",
        actor_id: "usr-2",
        timestamp: "2026-08-01T10:05:00Z",
        remarks: "Suppliers mapped to all three line items."
      },
      {
        id: "ev-04",
        rfq_id: "rfq-01",
        event_type: "TECHNICAL_RESPONSE_SUBMITTED",
        actor_name: "Supplier Parties",
        actor_id: "system",
        timestamp: "2026-08-02T12:05:00Z",
        remarks: "Initial technical responses submitted for active items."
      },
      {
        id: "ev-05",
        rfq_id: "rfq-01",
        event_type: "REVISION_REQUESTED",
        actor_name: "John Doe",
        actor_id: "usr-2",
        timestamp: "2026-08-03T08:30:00Z",
        remarks: "Buyer requested revision for item-03 shoe size requirement."
      },
      {
        id: "ev-06",
        rfq_id: "rfq-01",
        event_type: "TECHNICAL_RESPONSE_SUBMITTED",
        actor_name: "ASICS Seller Party",
        actor_id: "pty-3",
        timestamp: "2026-08-03T09:00:00Z",
        remarks: "Round-2 technical response submitted for item-03."
      },
      {
        id: "ev-07",
        rfq_id: "rfq-01",
        event_type: "TECHNICAL_APPROVED",
        actor_name: "John Doe",
        actor_id: "usr-2",
        timestamp: "2026-08-05T14:00:00Z",
        remarks: "Technical comparison finalized for item-01 suppliers."
      },
      {
        id: "ev-08",
        rfq_id: "rfq-01",
        event_type: "AWARDED",
        actor_name: "John Doe",
        actor_id: "usr-2",
        timestamp: "2026-08-05T14:00:00Z",
        remarks: "Split award released for item-01 across two suppliers."
      }
    ]
  }
];
