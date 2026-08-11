import type { SellerQuote } from "./rfq.module";

export const mockSellerQuotes: SellerQuote[] = [
  {
    id: "q-001",
    rfq_item_id: "item-01",
    seller_id: "pty-3",
    status: "ACCEPTED",
    current_revision_id: "qrev-001-1",
    created_at: "2026-08-02T10:00:00Z",
    updated_at: "2026-08-05T14:00:00Z",
    unit_price: 1080
  },
  {
    id: "q-002",
    rfq_item_id: "item-01",
    seller_id: "pty-6",
    status: "ACCEPTED",
    current_revision_id: "qrev-002-1",
    created_at: "2026-08-02T11:00:00Z",
    updated_at: "2026-08-05T14:00:00Z",
    unit_price: 1120
  },
  {
    id: "q-003",
    rfq_item_id: "item-02",
    seller_id: "pty-4",
    status: "SUBMITTED",
    current_revision_id: "qrev-003-1",
    created_at: "2026-08-02T12:00:00Z",
    updated_at: "2026-08-02T12:05:00Z",
    unit_price: 1999
  },
  {
    id: "q-004",
    rfq_item_id: "item-02",
    seller_id: "pty-5",
    status: "DRAFT",
    current_revision_id: "qrev-004-1",
    created_at: "2026-08-02T12:00:00Z",
    updated_at: "2026-08-02T12:00:00Z",
    unit_price: 1899
  },
  {
    id: "q-005",
    rfq_item_id: "item-03",
    seller_id: "pty-3",
    status: "SUBMITTED",
    current_revision_id: "qrev-005-2",
    created_at: "2026-08-02T14:00:00Z",
    updated_at: "2026-08-03T09:00:00Z",
    unit_price: 160
  },
  {
    id: "q-006",
    rfq_item_id: "item-03",
    seller_id: "pty-8",
    status: "SUBMITTED",
    current_revision_id: "qrev-006-1",
    created_at: "2026-08-02T14:00:00Z",
    updated_at: "2026-08-02T14:00:00Z",
    unit_price: 155
  }
];
