import type { RfqItemAttribute } from "./rfq.module";

export const mockRfqItemAttributes: RfqItemAttribute[] = [
  {
    id: "ia-01-1",
    rfq_item_id: "item-01",
    group_id: "grp-4",
    attribute_id: "attr-7",
    attribute_name: "Exterior Finish",
    description: "Premium titanium matte finish preferred.",
    values: [{ value_id: "val-7-1", value_label: "Titanium Black" }]
  },
  {
    id: "ia-01-2",
    rfq_item_id: "item-01",
    group_id: "grp-5",
    attribute_id: "attr-9",
    attribute_name: "Storage Capacity",
    description: "Enterprise storage requirement.",
    values: [{ value_id: "val-9-2", value_label: "1TB" }]
  },
  {
    id: "ia-02-1",
    rfq_item_id: "item-02",
    group_id: "grp-1",
    attribute_id: "attr-1",
    attribute_name: "Chassis Color",
    description: "Must be scratch-resistant dark color.",
    values: [{ value_id: "val-1-1", value_label: "Off Black" }]
  },
  {
    id: "ia-02-2",
    rfq_item_id: "item-02",
    group_id: "grp-1",
    attribute_id: "attr-2",
    attribute_name: "Operating System",
    description: "Corporate standard operating system.",
    values: [{ value_id: "val-2-1", value_label: "Windows 11 Pro" }]
  },
  {
    id: "ia-03-2-1",
    rfq_item_id: "item-03",
    group_id: "grp-7",
    attribute_id: "attr-13",
    attribute_name: "US Shoe Size",
    description: "Updated size requirement based on crew fitting.",
    values: [{ value_id: "val-13-1", value_label: "US 10" }]
  },
  {
    id: "ia-03-2-2",
    rfq_item_id: "item-03",
    group_id: "grp-7",
    attribute_id: "attr-14",
    attribute_name: "Shoe Width",
    description: "Standard width.",
    values: [{ value_id: "val-14-1", value_label: "Standard (D)" }]
  }
];
