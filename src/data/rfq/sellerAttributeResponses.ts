import type { SellerAttributeResponse } from './rfq.module';

export const mockSellerAttributeResponses: SellerAttributeResponse[] = [
  {
    id: "resp-001",
    quoteId: "q-001",
    groupId: "grp-1",
    attributeId: "attr-01",
    buyerValue: [{ valueId: "val1", valueLabel: "Black" }],
    value: [{ valueId: "val2", valueLabel: "Matte Black" }]
  },
  {
    id: "resp-002",
    quoteId: "q-002",
    groupId: "grp-1",
    attributeId: "attr-01",
    buyerValue: [{ valueId: "val1", valueLabel: "Black" }],
    value: [{ valueId: "val1", valueLabel: "Black" }]
  }
];
