import type { AttributeResponseHistory } from './rfq.module';

export const mockAttributeResponseHistories: AttributeResponseHistory[] = [
  // Item 1 History
  {
    id: "hist-001",
    responseId: "resp-001",
    quoteId: "q-001",
    round: 1,
    groupId: "grp-1",
    attributeId: "attr-1",
    buyerValue: [{ valueId: "val-1-1", valueLabel: "Off Black" }],
    value: [{ valueId: "val-1-2", valueLabel: "Eclipse Gray" }],
    archivedAt: "2026-08-02T10:00:00Z"
  },
  // Item 3 History (Round 1 Revision Requested snapshot)
  {
    id: "hist-002",
    responseId: "resp-005",
    quoteId: "q-005",
    round: 1,
    groupId: "grp-7",
    attributeId: "attr-13",
    buyerValue: [{ valueId: "val-13-1", valueLabel: "US 10" }],
    value: [{ valueId: "val-13-2", valueLabel: "US 11" }],
    archivedAt: "2026-08-02T15:00:00Z"
  }
];
