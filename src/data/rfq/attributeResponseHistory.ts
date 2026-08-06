import type { AttributeResponseHistory } from './rfq.module';

export const mockAttributeResponseHistories: AttributeResponseHistory[] = [
  {
    id: "hist-001",
    responseId: "resp-001",
    quoteId: "q-001",
    round: 1,
    groupId: "grp-1",
    attributeId: "attr-01",
    buyerValue: [{ valueId: "val1", valueLabel: "Black" }],
    value: [{ valueId: "val3", valueLabel: "Glossy Black" }],
    archivedAt: "2026-08-02T10:00:00Z"
  }
];
