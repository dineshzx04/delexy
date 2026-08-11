import type { ItemAttributeChangeHistory } from './rfq.module';

export const mockItemAttributeChangeHistories: ItemAttributeChangeHistory[] = [
  {
    id: "hist-001",
    rfq_item_id: "item-01",
    seller_quote_id: "q-002",
    round: 1,
    group_id: "grp-4",
    attribute_id: "attr-7",
    attribute_name: "Exterior Finish",
    value_type: "SELECT",
    actor_type: "SELLER",
    actor_id: "pty-6",
    old_value: [{ value_id: "val-7-1", value_label: "Titanium Black" }],
    new_value: [{ value_id: "val-7-2", value_label: "Titanium Gray" }],
    archived_at: "2026-08-02T10:00:00Z",
    timestamp: "2026-08-02T10:00:00Z"
  },
  {
    id: "hist-002",
    rfq_item_id: "item-02",
    seller_quote_id: null,
    round: 1,
    group_id: "grp-1",
    attribute_id: "attr-2",
    attribute_name: "Operating System",
    value_type: "SELECT",
    actor_type: "BUYER",
    actor_id: "usr-2",
    old_value: [{ value_id: "val-2-2", value_label: "Windows 11 Home" }],
    new_value: [{ value_id: "val-2-1", value_label: "Windows 11 Pro" }],
    change_reason: "Upgraded requirement to Enterprise Pro license",
    archived_at: "2026-08-01T11:00:00Z",
    timestamp: "2026-08-01T11:00:00Z"
  },
  {
    id: "hist-003",
    rfq_item_id: "item-03",
    seller_quote_id: "q-005",
    round: 1,
    group_id: "grp-7",
    attribute_id: "attr-13",
    attribute_name: "US Shoe Size",
    value_type: "SELECT",
    actor_type: "SELLER",
    actor_id: "pty-3",
    old_value: [{ value_id: "val-13-1", value_label: "US 10" }],
    new_value: [{ value_id: "val-13-2", value_label: "US 11" }],
    archived_at: "2026-08-02T15:00:00Z",
    timestamp: "2026-08-02T15:00:00Z"
  }
];
