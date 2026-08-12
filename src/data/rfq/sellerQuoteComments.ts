import type { SellerQuoteComment } from "./rfq.module";

export const mockSellerQuoteComments: SellerQuoteComment[] = [
  // Discussion on item-03 (Footwear) during Round 1 and Round 2
  {
    id: "c-001",
    seller_quote_id: "q-03-1",
    group_id: "grp-7",
    attribute_id: "attr-13",
    comment: "Confirming we can supply standard US 10 fit.",
    actor_type: "SELLER",
    actor_id: "pty-3",
    created_at: "2026-08-02T10:05:00Z"
  },
  {
    id: "c-002",
    seller_quote_id: "q-03-1",
    group_id: "grp-7",
    attribute_id: "attr-13",
    comment: "Please check if you can expedite shipping for this size.",
    actor_type: "BUYER",
    actor_id: "pty-1",
    created_at: "2026-08-02T12:00:00Z"
  },
  {
    id: "c-003",
    seller_quote_id: "q-03-2",
    group_id: "grp-7",
    attribute_id: "attr-13",
    comment: "Expedited shipping is confirmed for Round 2 quote.",
    actor_type: "SELLER",
    actor_id: "pty-3",
    created_at: "2026-08-03T09:10:00Z"
  }
];
