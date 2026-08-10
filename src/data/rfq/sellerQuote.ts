import type { SellerQuote } from './rfq.module';

export const mockSellerQuotes: SellerQuote[] = [
  // Item 1 Quotes (Awarded)
  {
    id: "q-001",
    itemId: "item-01",
    sellerId: "pty-3",
    itemRevision: 1,
    round: 2,
    unit_price: 108,
    status: "FINALIZED"
  },
  {
    id: "q-002",
    itemId: "item-01",
    sellerId: "pty-6",
    itemRevision: 1,
    round: 1,
    unit_price: 112,
    status: "FINALIZED"
  },
  // Item 2 Quotes (Under Evaluation)
  {
    id: "q-003",
    itemId: "item-02",
    sellerId: "pty-4",
    itemRevision: 1,
    round: 1,
    unit_price: 1999,
    status: "SUBMITTED"
  },
  {
    id: "q-004",
    itemId: "item-02",
    sellerId: "pty-5",
    itemRevision: 1,
    round: 1,
    unit_price: 1899,
    status: "DRAFT"
  },
  // Item 3 Quotes (Revision Requested)
  {
    id: "q-005",
    itemId: "item-03",
    sellerId: "pty-3",
    itemRevision: 1,
    round: 2,
    unit_price: 160,
    status: "DRAFT"
  },
  {
    id: "q-006",
    itemId: "item-03",
    sellerId: "pty-8",
    itemRevision: 1,
    round: 1,
    unit_price: 155,
    status: "DRAFT"
  }
];
