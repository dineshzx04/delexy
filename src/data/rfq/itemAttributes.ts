import type { ItemAttribute } from './rfq.module';

export const mockItemAttributes: ItemAttribute[] = [
  {
    id: "ia-01",
    itemId: "item-01",
    groupId: "grp-1",
    attributeId: "attr-1",
    attributeName: "Chassis Color",
    description: "Must be scratch-resistant.",
    currentBuyerValues: [{ valueId: "val-1-1", valueLabel: "Off Black" }]
  },
  {
    id: "ia-02",
    itemId: "item-02",
    groupId: "grp-1",
    attributeId: "attr-1",
    attributeName: "Chassis Color",
    description: "Deep eclipse color preferred.",
    currentBuyerValues: [{ valueId: "val-1-1", valueLabel: "Off Black" }]
  },
  {
    id: "ia-03",
    itemId: "item-02",
    groupId: "grp-1",
    attributeId: "attr-2",
    attributeName: "Operating System",
    description: "Corporate standard operating system.",
    currentBuyerValues: [{ valueId: "val-2-1", valueLabel: "Windows 11 Pro" }]
  },
  {
    id: "ia-04",
    itemId: "item-03",
    groupId: "grp-7",
    attributeId: "attr-13",
    attributeName: "US Shoe Size",
    description: "Standard executive shoe size.",
    currentBuyerValues: [{ valueId: "val-13-1", valueLabel: "US 10" }]
  },
  {
    id: "ia-05",
    itemId: "item-03",
    groupId: "grp-7",
    attributeId: "attr-14",
    attributeName: "Shoe Width",
    description: "Standard width width.",
    currentBuyerValues: [{ valueId: "val-14-1", valueLabel: "Standard (D)" }]
  }
];
