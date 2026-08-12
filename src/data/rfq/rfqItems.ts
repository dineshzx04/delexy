import type { RfqItem } from "./rfq.module";

export const mockRfqItems: RfqItem[] = [
  {
    id: "item-01",
    rfq_id: "rfq-01",
    category_id: "c-3-1-1",
    quantity: 5,
    unit: "Units",
    item_index: 1,
    created_at: "2026-08-10T09:00:00Z",
    updated_at: "2026-08-10T09:00:00Z",
    status: "OPEN",
    item_source: "CATALOG_PRODUCT_VARIANT",
    catalog_product_id: "prod-2",
    product_name: "Galaxy S24 Ultra Platform Base",
    brand_id: ["brd-1"],
    manufacturer_id: ["pty-1"],
    target_unit_price: 1000,
    awarded_quantity_total: 0,
    seller_assignments: []
  },
  {
    id: "item-02",
    rfq_id: "rfq-02",
    category_id: "c-2-1-1",
    quantity: 10,
    unit: "Units",
    item_index: 1,
    created_at: "2026-08-01T10:00:00Z",
    updated_at: "2026-08-01T10:00:00Z",
    status: "OPEN",
    item_source: "CATALOG_PRODUCT_VARIANT",
    catalog_product_id: "prod-1",
    product_name: "ROG Strix SCAR 16 Platform Series",
    brand_id: ["brd-2"],
    manufacturer_id: ["pty-5"],
    target_unit_price: 2000,
    awarded_quantity_total: 0,
    seller_assignments: [
      {
        id: "sa-02-1",
        rfq_item_id: "item-02",
        seller_party_id: "pty-4",
        assignment_type: "DIRECT_INVITATION",
        assigned_by_user_id: "usr-3",
        assigned_at: "2026-08-01T10:00:00Z"
      }
    ]
  },
  {
    id: "item-03",
    rfq_id: "rfq-03",
    category_id: "c-4-1-1-1",
    quantity: 50,
    unit: "Pairs",
    item_index: 1,
    created_at: "2026-08-01T09:00:00Z",
    updated_at: "2026-08-03T09:00:00Z",
    status: "OPEN",
    item_source: "CATALOG_PRODUCT_VARIANT",
    catalog_product_id: "prod-3",
    product_name: "Gel-Nimbus 26 Master Template",
    brand_id: ["brd-4"],
    manufacturer_id: ["pty-3"],
    target_unit_price: 160,
    awarded_quantity_total: 0,
    seller_assignments: [
      {
        id: "sa-03-1",
        rfq_item_id: "item-03",
        seller_party_id: "pty-3",
        assignment_type: "DIRECT_INVITATION",
        assigned_by_user_id: "usr-2",
        assigned_at: "2026-08-01T09:00:00Z"
      }
    ]
  },
  {
    id: "item-04",
    rfq_id: "rfq-04",
    category_id: "c-3-1-1",
    quantity: 20,
    unit: "Units",
    item_index: 1,
    created_at: "2026-08-01T09:00:00Z",
    updated_at: "2026-08-05T14:00:00Z",
    status: "AWARDED",
    item_source: "CATALOG_PRODUCT_VARIANT",
    catalog_product_id: "prod-2",
    product_name: "Galaxy S24 Ultra Platform Base",
    brand_id: ["brd-1"],
    manufacturer_id: ["pty-1"],
    target_unit_price: 1100,
    awarded_quantity_total: 20,
    seller_assignments: [
      {
        id: "sa-04-1",
        rfq_item_id: "item-04",
        seller_party_id: "pty-6",
        assignment_type: "DIRECT_INVITATION",
        assigned_by_user_id: "usr-2",
        assigned_at: "2026-08-01T09:00:00Z"
      }
    ]
  },
  {
    id: "item-05",
    rfq_id: "rfq-05",
    category_id: "c-5-1-1",
    quantity: 15,
    unit: "Units",
    item_index: 1,
    created_at: "2026-08-01T09:00:00Z",
    updated_at: "2026-08-02T12:00:00Z",
    status: "CANCELLED",
    item_source: "CATALOG_PRODUCT_VARIANT",
    catalog_product_id: "prod-4",
    product_name: "Alpha 7 IV Mirrorless Platform",
    brand_id: ["brd-3"],
    manufacturer_id: ["pty-4"],
    target_unit_price: 2500,
    awarded_quantity_total: 0,
    seller_assignments: [
      {
        id: "sa-05-1",
        rfq_item_id: "item-05",
        seller_party_id: "pty-4",
        assignment_type: "DIRECT_INVITATION",
        assigned_by_user_id: "usr-4",
        assigned_at: "2026-08-01T09:00:00Z"
      }
    ]
  }
];
