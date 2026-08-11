import type { SellerQuoteComment } from "./rfq.module";

export const mockSellerQuoteComments: SellerQuoteComment[] = [
  {
    id: "c-001",
    seller_quote_id: "q-001",
    quote_attribute_id: "qa-01-1",
    comment: "We can supply Titanium Black as requested.",
    sender: "SELLER",
    sender_id: "pty-3",
    created_at: "2026-08-02T10:00:00Z"
  },
  {
    id: "c-002",
    seller_quote_id: "q-002",
    quote_attribute_id: "qa-02-1",
    comment: "We currently only have Titanium Gray in stock. Is that acceptable?",
    sender: "SELLER",
    sender_id: "pty-6",
    created_at: "2026-08-02T11:00:00Z"
  },
  {
    id: "c-003",
    seller_quote_id: "q-002",
    quote_attribute_id: "qa-02-1",
    comment: "Titanium Gray is acceptable as long as it has anti-fingerprint coating.",
    sender: "BUYER",
    sender_id: "pty-1",
    created_at: "2026-08-02T12:00:00Z"
  },
  {
    id: "c-004",
    seller_quote_id: "q-005",
    quote_attribute_id: "qa-05-1-1",
    comment: "US 10 is currently backordered for 2 weeks. Offering US 11 as alternative.",
    sender: "SELLER",
    sender_id: "pty-3",
    created_at: "2026-08-02T14:00:00Z"
  },
  {
    id: "c-005",
    seller_quote_id: "q-005",
    quote_attribute_id: "qa-05-2-1",
    comment: "We have requested a revision to size US 10. Can you confirm if backorder cleared?",
    sender: "BUYER",
    sender_id: "pty-1",
    created_at: "2026-08-03T08:30:00Z"
  },
  {
    id: "c-006",
    seller_quote_id: "q-005",
    quote_attribute_id: "qa-05-2-1",
    comment: "Yes, we confirmed with logistics. We can supply US 10 directly now.",
    sender: "SELLER",
    sender_id: "pty-3",
    created_at: "2026-08-03T09:00:00Z"
  }
];
