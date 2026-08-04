import type { RfqItemAward } from './rfq.module';

export const mockRfqAwards: RfqItemAward[] = [
  // Award 1: 60 units awarded to Sony Corp (pty-4) via isr-501
  {
    id: 'award-801',
    rfq_id: 'rfq-2026-1001',
    rfq_item_id: 'rfqi-101',
    item_supplier_response_id: 'isr-501',
    
    seller_party_id: 'pty-4',             // Sony Corporation Global Party
    seller_product_id: 'sprod-1',
    variant_id: 'sprod-1-v2',

    awarded_quantity: 60,                 // Split quantity 1
    awarded_unit_price: 1000,
    awarded_total_amount: 60000,
    currency: 'USD',

    awarded_by_user_id: 'usr-2',         // John Doe
    awarded_at: '2026-08-02T12:00:00.000Z',
    status: 'PURCHASE_ORDER_GENERATED',
    purchase_order_id: 'po-2026-801',
  },

  // Award 2: Remaining 40 units awarded to ASUSTeK (pty-5) via isr-502
  {
    id: 'award-802',
    rfq_id: 'rfq-2026-1001',
    rfq_item_id: 'rfqi-101',
    item_supplier_response_id: 'isr-502',

    seller_party_id: 'pty-5',             // ASUSTeK Computer Inc Party
    seller_product_id: 'sprod-1',
    variant_id: 'sprod-1-v1',

    awarded_quantity: 40,                 // Split quantity 2
    awarded_unit_price: 1050,
    awarded_total_amount: 42000,
    currency: 'USD',

    awarded_by_user_id: 'usr-2',         // John Doe
    awarded_at: '2026-08-02T12:05:00.000Z',
    status: 'PURCHASE_ORDER_GENERATED',
    purchase_order_id: 'po-2026-802',
  }
];
