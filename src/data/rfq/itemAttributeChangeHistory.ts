import type { ItemAttributeChangeHistory } from './rfq.module';

export const mockItemAttributeChangeHistories: ItemAttributeChangeHistory[] = [
  // Item 1 History: Seller quote response change diff
  {
    id: "hist-001",
    itemId: "item-01",
    quoteId: "q-001",
    round: 1,
    groupId: "grp-1",
    attributeId: "attr-1",
    attributeName: "Chassis Color",
    valueType: "SELECT",
    actorType: "SELLER",
    actorId: "pty-3",
    oldValue: [{ valueId: "val-1-1", valueLabel: "Off Black" }],
    newValue: [{ valueId: "val-1-2", valueLabel: "Eclipse Gray" }],
    // Compatibility fields
    responseId: "resp-001",
    buyerValue: [{ valueId: "val-1-1", valueLabel: "Off Black" }],
    value: [{ valueId: "val-1-2", valueLabel: "Eclipse Gray" }],
    archivedAt: "2026-08-02T10:00:00Z",
    timestamp: "2026-08-02T10:00:00Z"
  },
  // Item 2 History: Buyer item specification revision diff (No Quote ID)
  {
    id: "hist-002",
    itemId: "item-02",
    itemRevision: 2,
    quoteId: null,
    groupId: "grp-1",
    attributeId: "attr-2",
    attributeName: "Operating System",
    valueType: "SELECT",
    actorType: "BUYER",
    actorId: "usr-2",
    oldValue: [{ valueId: "val-2-2", valueLabel: "Windows 11 Home" }],
    newValue: [{ valueId: "val-2-1", valueLabel: "Windows 11 Pro" }],
    changeReason: "Upgraded requirement to Enterprise Pro license",
    archivedAt: "2026-08-01T11:00:00Z",
    timestamp: "2026-08-01T11:00:00Z"
  },
  // Item 3 History: Round 1 Revision Requested seller response diff
  {
    id: "hist-003",
    itemId: "item-03",
    quoteId: "q-005",
    round: 1,
    groupId: "grp-7",
    attributeId: "attr-13",
    attributeName: "US Shoe Size",
    valueType: "SELECT",
    actorType: "SELLER",
    actorId: "pty-3",
    oldValue: [{ valueId: "val-13-1", valueLabel: "US 10" }],
    newValue: [{ valueId: "val-13-2", valueLabel: "US 11" }],
    // Compatibility fields
    responseId: "resp-005",
    buyerValue: [{ valueId: "val-13-1", valueLabel: "US 10" }],
    value: [{ valueId: "val-13-2", valueLabel: "US 11" }],
    archivedAt: "2026-08-02T15:00:00Z",
    timestamp: "2026-08-02T15:00:00Z"
  }
];
