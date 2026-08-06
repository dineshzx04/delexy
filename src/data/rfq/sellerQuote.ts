import type { SellerQuote } from './rfq.module';

export const mockSellerQuotes: SellerQuote[] = [
  {
    id: "q-001",
    itemId: "item-01",
    sellerId: "sel-01",
    itemRevision: 1,     // Quote is bidding against Item Revision 1
    round: 2,           // Increments with each negotiation round
    unit_price: 108,    // Latest unit price offered
    status: "FINALIZED" // DRAFT | SUBMITTED | FINALIZED
  },
  {
    id: "q-002",
    itemId: "item-01",
    sellerId: "sel-02",
    itemRevision: 1,     // Quote is bidding against Item Revision 1
    round: 1,           // Remained on round 1
    unit_price: 112,    // Offered price
    status: "FINALIZED" // DRAFT | SUBMITTED | FINALIZED
  }
];
