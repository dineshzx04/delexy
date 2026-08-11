import type { SellerQuoteRevision } from "./rfq.module";

export const mockSellerQuoteRevisions: SellerQuoteRevision[] = [
  // Item 1 Quote Revisions (Smartphones)
  {
    id: "qrev-001-1",
    seller_quote_id: "q-001",
    rfq_item_revision_id: "rev-item-01-1",
    revision_number: 1,
    created_by: "usr-3",
    created_at: "2026-08-02T10:00:00Z"
  },
  {
    id: "qrev-002-1",
    seller_quote_id: "q-002",
    rfq_item_revision_id: "rev-item-01-1",
    revision_number: 1,
    created_by: "usr-2",
    created_at: "2026-08-02T11:00:00Z"
  },

  // Item 2 Quote Revisions (Gaming Laptops)
  {
    id: "qrev-003-1",
    seller_quote_id: "q-003",
    rfq_item_revision_id: "rev-item-02-1",
    revision_number: 1,
    created_by: "usr-4",
    created_at: "2026-08-02T12:00:00Z"
  },
  {
    id: "qrev-004-1",
    seller_quote_id: "q-004",
    rfq_item_revision_id: "rev-item-02-1",
    revision_number: 1,
    created_by: "usr-3",
    created_at: "2026-08-02T12:00:00Z"
  },

  // Item 3 Quote Revisions (Running Shoes)
  {
    id: "qrev-005-1",
    seller_quote_id: "q-005",
    rfq_item_revision_id: "rev-item-03-1",
    revision_number: 1,
    created_by: "usr-3",
    created_at: "2026-08-02T14:00:00Z"
  },
  {
    id: "qrev-005-2", // Response to Buyer Revision 2 (negotiating size US 10)
    seller_quote_id: "q-005",
    rfq_item_revision_id: "rev-item-03-2",
    revision_number: 2,
    created_by: "usr-3",
    created_at: "2026-08-03T09:00:00Z"
  },
  {
    id: "qrev-006-1",
    seller_quote_id: "q-006",
    rfq_item_revision_id: "rev-item-03-1",
    revision_number: 1,
    created_by: "usr-3",
    created_at: "2026-08-02T14:00:00Z"
  }
];
