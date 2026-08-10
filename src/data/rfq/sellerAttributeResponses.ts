import type { SellerAttributeResponse } from './rfq.module';

export const mockSellerAttributeResponses: SellerAttributeResponse[] = [
  // Item 1 Responses
  {
    id: "resp-001",
    quoteId: "q-001",
    groupId: "grp-1",
    attributeId: "attr-1",
    buyerValue: [{ valueId: "val-1-1", valueLabel: "Off Black" }],
    value: [{ valueId: "val-1-2", valueLabel: "Eclipse Gray" }]
  },
  {
    id: "resp-002",
    quoteId: "q-002",
    groupId: "grp-1",
    attributeId: "attr-1",
    buyerValue: [{ valueId: "val-1-1", valueLabel: "Off Black" }],
    value: [{ valueId: "val-1-1", valueLabel: "Off Black" }]
  },
  // Item 2 Responses (Evaluation)
  {
    id: "resp-003",
    quoteId: "q-003",
    groupId: "grp-1",
    attributeId: "attr-1",
    buyerValue: [{ valueId: "val-1-1", valueLabel: "Off Black" }],
    value: [{ valueId: "val-1-2", valueLabel: "Eclipse Gray" }]
  },
  {
    id: "resp-004",
    quoteId: "q-003",
    groupId: "grp-1",
    attributeId: "attr-2",
    buyerValue: [{ valueId: "val-2-1", valueLabel: "Windows 11 Pro" }],
    value: [{ valueId: "val-2-1", valueLabel: "Windows 11 Pro" }]
  },
  // Item 3 Responses (Revision Requested)
  {
    id: "resp-005",
    quoteId: "q-005",
    groupId: "grp-7",
    attributeId: "attr-13",
    buyerValue: [{ valueId: "val-13-1", valueLabel: "US 10" }],
    value: [{ valueId: "val-13-2", valueLabel: "US 11" }]
  }
];
