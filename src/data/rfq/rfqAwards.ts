import type { RfqAward } from './rfq.module';

export const mockRfqAwards: RfqAward[] = [
  {
    id: "awd-01",
    rfq_id: "rfq-01",
    rfq_item_id: "item-01",
    seller_party_id: "pty-3",
    awarded_quantity: 8,
    unit_price: 1080,
    awarded_at: "2026-08-05T14:00:00Z",
    status: "PO_CREATED"
  },
  {
    id: "awd-02",
    rfq_id: "rfq-01",
    rfq_item_id: "item-01",
    seller_party_id: "pty-6",
    awarded_quantity: 2,
    unit_price: 1120,
    awarded_at: "2026-08-05T14:00:00Z",
    status: "PO_CREATED"
  }
];
