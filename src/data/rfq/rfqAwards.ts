import type { RfqAward } from "./rfq.module";

export const mockRfqAwards: RfqAward[] = [
  // Award for CLOSED RFQ item-04
  {
    id: "awd-04-1",
    rfq_id: "rfq-04",
    rfq_item_id: "item-04",
    seller_quote_id: "q-04-1",
    seller_party_id: "pty-6",
    awarded_quantity: 20,
    unit_price: 1080,
    currency: "USD",
    award_status: "PO_CREATED",
    product_mapping_status: "NOT_REQUIRED",
    variant_id: "sprod-1-v2",
    awarded_at: "2026-08-05T14:00:00Z",
    awarded_by_user_id: "usr-2"
  }
];
