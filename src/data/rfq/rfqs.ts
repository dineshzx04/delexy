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
        remarks: "RFQ issued to suppliers."
      }
    ]
  }
];
