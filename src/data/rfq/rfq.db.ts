import Dexie, { type Table } from 'dexie';
import type { Rfq, RfqItem, ItemSupplierResponse, RfqItemAward } from './rfq.module';

export class RfqDatabase extends Dexie {
  rfqs!: Table<Rfq, string>;
  rfqItems!: Table<RfqItem, string>;
  itemSupplierResponses!: Table<ItemSupplierResponse, string>;
  rfqAwards!: Table<RfqItemAward, string>;

  constructor() {
    super('delexy_rfq_db');
    this.version(2).stores({
      rfqs: 'id, rfq_number, requester_party_id, created_by_user_id, status, submission_deadline',
      rfqItems: 'id, rfq_id, category_id, catalog_product_id, brand_id, manufacturer_id, *target_seller_party_ids',
      itemSupplierResponses: 'id, rfq_id, rfq_item_id, seller_party_id, supplier_user_id, status, seller_product_id, variant_id, is_awarded',
      rfqAwards: 'id, rfq_id, rfq_item_id, item_supplier_response_id, seller_party_id, status',
    });
  }
}

export const rfqDb = new RfqDatabase();
