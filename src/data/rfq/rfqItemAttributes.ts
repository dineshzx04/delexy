import type { RfqItemAttribute } from "./rfq.module";

export const mockRfqItemAttributes: RfqItemAttribute[] = [
  {
    id: "ia-01-1",
    rfq_item_id: "item-01",
    group_id: "grp-4",
    attribute_id: "attr-7",
    description: "Premium titanium matte finish preferred.",
    values: [{ value_id: "val-7-1", value_label: "Titanium Black" }],
    created_at: "2026-08-10T09:00:00Z",
    updated_at: "2026-08-10T09:00:00Z"
  },
  {
    id: "ia-02-1",
    rfq_item_id: "item-02",
    group_id: "grp-1",
    attribute_id: "attr-1",
    description: "Must be scratch-resistant dark color.",
    values: [{ value_id: "val-1-1", value_label: "Off Black" }],
    created_at: "2026-08-01T10:00:00Z",
    updated_at: "2026-08-01T10:00:00Z"
  },
  {
    id: "ia-03-1",
    rfq_item_id: "item-03",
    group_id: "grp-7",
    attribute_id: "attr-13",
    description: "Shoe size requirement based on standard crew fitting.",
    values: [{ value_id: "val-13-1", value_label: "US 10" }],
    created_at: "2026-08-01T09:00:00Z",
    updated_at: "2026-08-03T09:00:00Z"
  },
  {
    id: "ia-04-1",
    rfq_item_id: "item-04",
    group_id: "grp-4",
    attribute_id: "attr-7",
    description: "Enterprise phone finish standard.",
    values: [{ value_id: "val-7-2", value_label: "Titanium Gray" }],
    created_at: "2026-08-01T09:00:00Z",
    updated_at: "2026-08-05T14:00:00Z"
  },
  {
    id: "ia-05-1",
    rfq_item_id: "item-05",
    group_id: "grp-5",
    attribute_id: "attr-10",
    description: "Camera sensor resolution specification.",
    values: [{ value_id: "val-10-1", value_label: "33MP" }],
    created_at: "2026-08-01T09:00:00Z",
    updated_at: "2026-08-02T12:00:00Z"
  }
];
