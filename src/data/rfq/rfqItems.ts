import type { RfqItem } from "./rfq.module";

export const mockRfqItems: RfqItem[] = [
  {
    id: "item-01",
    rfq_id: "rfq-01",
    category_id: "c-3-1-1",
    quantity: 10,
    unit: "Units",
    created_at: "2026-08-01T10:00:00Z",
    updated_at: "2026-08-05T14:00:00Z",
    item_index: 1,
    status: "FULLY_AWARDED",
    item_source: "CATALOG_PRODUCT_VARIANT",
    catalog_product_id: "prod-2",
    product_name: "Samsung Galaxy S24 Ultra Enterprise Edition",
    brand_id: "brd-1",
    manufacturer_id: "pty-1",
    target_unit_price: 1000,
    awarded_quantity_total: 10,
    target_seller_party_ids: ["pty-3", "pty-6"],
    seller_assignments: [
      {
        id: "sa-01-1",
        rfq_item_id: "item-01",
        seller_party_id: "pty-3",
        assignment_type: "DIRECT_INVITATION",
        assigned_by_user_id: "usr-2",
        assigned_at: "2026-08-01T10:00:00Z",
        status: "RESPONDED"
      },
      {
        id: "sa-01-2",
        rfq_item_id: "item-01",
        seller_party_id: "pty-6",
        assignment_type: "DIRECT_INVITATION",
        assigned_by_user_id: "usr-2",
        assigned_at: "2026-08-01T10:00:00Z",
        status: "RESPONDED"
      }
    ]
  },
  {
    id: "item-02",
    rfq_id: "rfq-01",
    category_id: "c-2-1-1",
    quantity: 50,
    unit: "Units",
    created_at: "2026-08-01T10:00:00Z",
    updated_at: "2026-08-02T12:05:00Z",
    item_index: 2,
    status: "OPEN",
    item_source: "CATALOG_PRODUCT_VARIANT",
    catalog_product_id: "prod-1",
    product_name: "ASUS ROG Zephyrus G16 Gaming Laptop",
    brand_id: "brd-2",
    manufacturer_id: "pty-5",
    target_unit_price: 2000,
    target_seller_party_ids: ["pty-4", "pty-5"],
    seller_assignments: [
      {
        id: "sa-02-1",
        rfq_item_id: "item-02",
        seller_party_id: "pty-4",
        assignment_type: "DIRECT_INVITATION",
        assigned_by_user_id: "usr-2",
        assigned_at: "2026-08-01T10:00:00Z",
        status: "RESPONDED"
      },
      {
        id: "sa-02-2",
        rfq_item_id: "item-02",
        seller_party_id: "pty-5",
        assignment_type: "DIRECT_INVITATION",
        assigned_by_user_id: "usr-2",
        assigned_at: "2026-08-01T10:00:00Z",
        status: "VIEWED"
      }
    ]
  },
  {
    id: "item-03",
    rfq_id: "rfq-01",
    category_id: "c-4-1-1-1",
    quantity: 100,
    unit: "Pairs",
    created_at: "2026-08-01T10:00:00Z",
    updated_at: "2026-08-03T09:00:00Z",
    item_index: 3,
    status: "OPEN",
    item_source: "CATALOG_PRODUCT_VARIANT",
    catalog_product_id: "prod-3",
    product_name: "ASICS Gel-Kayano 30 Running Shoes",
    brand_id: "brd-4",
    manufacturer_id: "pty-3",
    target_unit_price: 160,
    target_seller_party_ids: ["pty-3", "pty-8"],
    seller_assignments: [
      {
        id: "sa-03-1",
        rfq_item_id: "item-03",
        seller_party_id: "pty-3",
        assignment_type: "DIRECT_INVITATION",
        assigned_by_user_id: "usr-2",
        assigned_at: "2026-08-01T10:00:00Z",
        status: "RESPONDED"
      },
      {
        id: "sa-03-2",
        rfq_item_id: "item-03",
        seller_party_id: "pty-8",
        assigned_by_user_id: "usr-2",
        assigned_at: "2026-08-01T10:00:00Z",
        assignment_type: "DIRECT_INVITATION",
        status: "RESPONDED"
      }
    ]
  }
];
