import type { Rfq } from "./rfq.module";

export const mockRfqs: Rfq[] = [
  {
    id: "rfq-01",
    title: "Draft Corporate Smartphone Restock Request",
    description: "New draft request for corporate mobile phone upgrades.",
    rfq_number: "RFQ-001",
    submission_deadline: "2026-08-30T23:59:59.000Z",
    currency: "USD",
    requester_id: "pty-1",
    requester_name: "Samsung India Industrial Party",
    requester_party_id: "pty-1",
    requester_party_type: "BUSINESS",
    created_by_user_id: "usr-2",
    contact_email: "john.doe@samsung-india.com",
    contact_phone: "+91-9876543210",
    shipping_destination: "Samsung India HQ Facility, New Delhi, India",
    status: "ISSUED",
    created_at: "2026-08-10T09:00:00Z",
    updated_at: "2026-08-10T09:00:00Z",
  },
];
