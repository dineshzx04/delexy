import type { SellerQuoteAttribute } from "./rfq.module";

export const mockSellerQuoteAttributes: SellerQuoteAttribute[] = [
  {
    id: "qa-01-1",
    quote_revision_id: "qrev-001-1",
    item_attribute_id: "ia-01-1",
    group_id: "grp-4",
    attribute_id: "attr-7",
    attribute_name: "Exterior Finish",
    offered_values: [{ value_id: "val-7-1", value_label: "Titanium Black" }]
  },
  {
    id: "qa-01-2",
    quote_revision_id: "qrev-001-1",
    item_attribute_id: "ia-01-2",
    group_id: "grp-5",
    attribute_id: "attr-9",
    attribute_name: "Storage Capacity",
    offered_values: [{ value_id: "val-9-2", value_label: "1TB" }]
  },
  {
    id: "qa-02-1",
    quote_revision_id: "qrev-002-1",
    item_attribute_id: "ia-01-1",
    group_id: "grp-4",
    attribute_id: "attr-7",
    attribute_name: "Exterior Finish",
    offered_values: [{ value_id: "val-7-2", value_label: "Titanium Gray" }]
  },
  {
    id: "qa-02-2",
    quote_revision_id: "qrev-002-1",
    item_attribute_id: "ia-01-2",
    group_id: "grp-5",
    attribute_id: "attr-9",
    attribute_name: "Storage Capacity",
    offered_values: [{ value_id: "val-9-2", value_label: "1TB" }]
  },
  {
    id: "qa-03-1",
    quote_revision_id: "qrev-003-1",
    item_attribute_id: "ia-02-1",
    group_id: "grp-1",
    attribute_id: "attr-1",
    attribute_name: "Chassis Color",
    offered_values: [{ value_id: "val-1-2", value_label: "Eclipse Gray" }]
  },
  {
    id: "qa-03-2",
    quote_revision_id: "qrev-003-1",
    item_attribute_id: "ia-02-2",
    group_id: "grp-1",
    attribute_id: "attr-2",
    attribute_name: "Operating System",
    offered_values: [{ value_id: "val-2-1", value_label: "Windows 11 Pro" }]
  },
  {
    id: "qa-05-1-1",
    quote_revision_id: "qrev-005-1",
    item_attribute_id: "ia-03-2-1",
    group_id: "grp-7",
    attribute_id: "attr-13",
    attribute_name: "US Shoe Size",
    offered_values: [{ value_id: "val-13-2", value_label: "US 11" }]
  },
  {
    id: "qa-05-2-1",
    quote_revision_id: "qrev-005-2",
    item_attribute_id: "ia-03-2-1",
    group_id: "grp-7",
    attribute_id: "attr-13",
    attribute_name: "US Shoe Size",
    offered_values: [{ value_id: "val-13-1", value_label: "US 10" }]
  },
  {
    id: "qa-06-1-1",
    quote_revision_id: "qrev-006-1",
    item_attribute_id: "ia-03-2-1",
    group_id: "grp-7",
    attribute_id: "attr-13",
    attribute_name: "US Shoe Size",
    offered_values: [{ value_id: "val-13-2", value_label: "US 11" }]
  },
  {
    id: "qa-06-1-2",
    quote_revision_id: "qrev-006-1",
    item_attribute_id: "ia-03-2-2",
    group_id: "grp-7",
    attribute_id: "attr-14",
    attribute_name: "Shoe Width",
    offered_values: [{ value_id: "val-14-1", value_label: "Standard (D)" }]
  }
];
