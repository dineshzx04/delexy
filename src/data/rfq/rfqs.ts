import type { Rfq } from './rfq.module';

export const mockRfqs: Rfq[] = [
  {
    id: "rfq-01",
    status: "IN_PROGRESS",
    createdAt: "2026-08-01T09:00:00Z",
    // Compatibility fields
    rfq_number: "RFQ-2026-1001",
    title: "Q3 Corporate Smartphone Restock & Custom Equipment",
    description: "Bulk procurement of 10 units of flagship mobile devices.",
    requester_party_id: "pty-1",
    requester_party_type: "BUSINESS",
    requester_name: "Samsung Electronics India Party",
    created_by_user_id: "usr-2",
    contact_email: "john.doe@samsung-india.com",
    contact_phone: "+91-9876543210",
    shipping_destination: "Samsung India HQ Facility, New Delhi, India",
    submission_deadline: "2026-08-30T23:59:59.000Z",
    total_items_count: 1,
    total_estimated_budget: 100000,
    currency: "USD",
    attachments: [],
    timeline: [],
    updated_at: "2026-08-02T12:05:00.000Z"
  }
];
