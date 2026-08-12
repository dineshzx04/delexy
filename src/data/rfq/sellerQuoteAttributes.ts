import type { SellerQuoteAttribute } from "./rfq.module";

export const mockSellerQuoteAttributes: SellerQuoteAttribute[] = [
  // Attributes offered for active negotiations
  {
    id: "qa-03-1-1",
    seller_quote_id: "q-03-1",
    group_id: "grp-7",
    attribute_id: "attr-13",
    offered_values: [{ value_id: "val-13-1", value_label: "US 10" }],
    attribute_type: "CUSTOM"
  },
  {
    id: "qa-03-2-1",
    seller_quote_id: "q-03-2",
    group_id: "grp-7",
    attribute_id: "attr-13",
    offered_values: [{ value_id: "val-13-1", value_label: "US 10" }],
    attribute_type: "CUSTOM"
  },
  // SYSTEM attributes for q-03-2
  {
    id: "qa-03-2-sys-brand",
    seller_quote_id: "q-03-2",
    group_id: "system-preferences",
    attribute_id: "brand",
    offered_values: [{ value_id: "brd-4", value_label: "ASICS" }],
    attribute_type: "SYSTEM"
  },
  {
    id: "qa-03-2-sys-mfg",
    seller_quote_id: "q-03-2",
    group_id: "system-preferences",
    attribute_id: "manufacturer",
    offered_values: [{ value_id: "mfg-3", value_label: "ASICS Global" }],
    attribute_type: "SYSTEM"
  },
  {
    id: "qa-03-2-sys-price",
    seller_quote_id: "q-03-2",
    group_id: "system-commercial",
    attribute_id: "unit_price",
    offered_values: [{ value_id: "price-offer", value_label: "150" }],
    attribute_type: "SYSTEM"
  },
  // Attributes offered for accepted quote
  {
    id: "qa-04-1-1",
    seller_quote_id: "q-04-1",
    group_id: "grp-4",
    attribute_id: "attr-7",
    offered_values: [{ value_id: "val-7-2", value_label: "Titanium Gray" }],
    attribute_type: "CUSTOM"
  },
  // Attributes offered for rejected quote
  {
    id: "qa-05-1-1",
    seller_quote_id: "q-05-1",
    group_id: "grp-5",
    attribute_id: "attr-10",
    offered_values: [{ value_id: "val-10-1", value_label: "33MP" }],
    attribute_type: "CUSTOM"
  }
];
