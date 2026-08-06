import type { ItemAttribute } from './rfq.module';

export const mockItemAttributes: ItemAttribute[] = [
  {
    id: "ia-01",
    itemId: "item-01",
    groupId: "grp-1",
    attributeId: "attr-01",
    attributeName: "Color",
    description: "Must be scratch-resistant.",
    currentBuyerValues: [{ valueId: "val1", valueLabel: "Black" }]
  }
];
