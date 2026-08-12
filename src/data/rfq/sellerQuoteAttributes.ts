import type { SellerQuoteAttribute } from "./rfq.module";

export const mockSellerQuoteAttributes: SellerQuoteAttribute[] = [
  // Attributes offered for active negotiations
  {
    id: "qa-03-1-1",
    seller_quote_id: "q-03-1",
    group_id: "grp-7",
    attribute_id: "attr-13",
    offered_values: [{ value_id: "val-13-1", value_label: "US 10" }]
  },
  {
    id: "qa-03-2-1",
    seller_quote_id: "q-03-2",
    group_id: "grp-7",
    attribute_id: "attr-13",
    offered_values: [{ value_id: "val-13-1", value_label: "US 10" }]
  },
  // Attributes offered for accepted quote
  {
    id: "qa-04-1-1",
    seller_quote_id: "q-04-1",
    group_id: "grp-4",
    attribute_id: "attr-7",
    offered_values: [{ value_id: "val-7-2", value_label: "Titanium Gray" }]
  },
  // Attributes offered for rejected quote
  {
    id: "qa-05-1-1",
    seller_quote_id: "q-05-1",
    group_id: "grp-5",
    attribute_id: "attr-10",
    offered_values: [{ value_id: "val-10-1", value_label: "33MP" }]
  }
];
