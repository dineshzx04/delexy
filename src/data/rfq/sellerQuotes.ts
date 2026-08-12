import type { SellerQuote } from "./rfq.module";

export const mockSellerQuotes: SellerQuote[] = [
  // Quotes for item-03 (IN_PROGRESS lifecycle)
  {
    id: "q-03-1",
    rfq_item_id: "item-03",
    seller_party_id: "pty-3",
    seller_quote_number: "SQ-003-R1",
    unit_price: 160,
    round: 1,
    status: "REVISION_REQUIRED",
    brand_id: ["brd-4"],
    manufacturer_id: ["pty-3"],
    created_at: "2026-08-02T10:00:00Z",
    updated_at: "2026-08-03T08:30:00Z",
    seller_product_mapping: null
  },
  {
    id: "q-03-2",
    rfq_item_id: "item-03",
    seller_party_id: "pty-3",
    seller_quote_number: "SQ-003-R2",
    unit_price: 150,
    round: 2,
    status: "SUBMITTED",
    brand_id: ["brd-4"],
    manufacturer_id: ["pty-3"],
    created_at: "2026-08-03T09:00:00Z",
    updated_at: "2026-08-03T09:00:00Z",
    seller_product_mapping: null
  },
  // Accepted Quote for item-04 (CLOSED lifecycle)
  {
    id: "q-04-1",
    rfq_item_id: "item-04",
    seller_party_id: "pty-6",
    seller_quote_number: "SQ-004-R1",
    unit_price: 1080,
    round: 1,
    status: "ACCEPTED",
    brand_id: ["brd-1"],
    manufacturer_id: ["pty-1"],
    created_at: "2026-08-02T11:00:00Z",
    updated_at: "2026-08-05T14:00:00Z",
    seller_product_mapping: {
      seller_product_id: "sprod-1",
      variant_id: "sprod-1-v2",
      mapped_at: "2026-08-02T11:00:00Z",
      is_buyer_approved: true
    }
  },
  // Rejected Quote for item-05 (CANCELLED lifecycle)
  {
    id: "q-05-1",
    rfq_item_id: "item-05",
    seller_party_id: "pty-4",
    seller_quote_number: "SQ-005-R1",
    unit_price: 2500,
    round: 1,
    status: "REJECTED",
    brand_id: ["brd-3"],
    manufacturer_id: ["pty-4"],
    created_at: "2026-08-02T12:00:00Z",
    updated_at: "2026-08-02T12:00:00Z",
    seller_product_mapping: null
  }
];
