import type { RfqAward } from './rfq.module';

export const mockRfqAwards: RfqAward[] = [
  {
    id: "awd-01",
    rfqId: "rfq-01",
    itemId: "item-01",
    sellerId: "pty-3",
    awardedQuantity: 8, // Split quantity (total requested was 10)
    unitPrice: 108,
    awardedAt: "2026-08-05T14:00:00Z"
  },
  {
    id: "awd-02",
    rfqId: "rfq-01",
    itemId: "item-01",
    sellerId: "pty-6",
    awardedQuantity: 2, // Must be >= 1
    unitPrice: 112,
    awardedAt: "2026-08-05T14:00:00Z"
  }
];
