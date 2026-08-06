import type { RfqItem } from './rfq.module';

export const mockRfqItems: RfqItem[] = [
  {
    id: "item-01",
    rfqId: "rfq-01",
    itemRevision: 1, // Buyer-led item revision/version
    categoryId: "cat-01",
    quantity: 10,
    unit_price: 100,
    unit: "kg",
    targettedSellerIds: ["sel-01", "sel-02"],
    // Compatibility fields
    rfq_id: "rfq-01",
    item_index: 1,
    status: "OPEN",
    product_name: "Samsung Galaxy S24 Ultra Enterprise Edition",
    brand_id: "brd-1",
    manufacturer_id: "mfg-1",
    unit_of_measure: "Units",
    target_unit_price: 100,
    created_at: "2026-08-01T10:00:00.000Z",
    updated_at: "2026-08-02T12:05:00.000Z"
  }
];
