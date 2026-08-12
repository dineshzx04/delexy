import Dexie, { type Table } from "dexie";
import type {
  Rfq,
  RfqItem,
  RfqItemAttribute,
  SellerQuote,
  SellerQuoteAttribute,
  SellerQuoteComment,
  RfqAward,
} from "./rfq.module";

export class RfqDatabase extends Dexie {
  rfqs!: Table<Rfq, string>;
  rfq_items!: Table<RfqItem, string>;
  rfq_item_attributes!: Table<RfqItemAttribute, string>;
  seller_quotes!: Table<SellerQuote, string>;
  seller_quote_attributes!: Table<SellerQuoteAttribute, string>;
  seller_quote_comments!: Table<SellerQuoteComment, string>;
  rfq_awards!: Table<RfqAward, string>;

  constructor() {
    super("delexy_rfq_db");
    this.version(8).stores({
      rfqs: "id, status, requester_id, requester_party_id",
      rfq_items: "id, rfq_id, category_id",
      rfq_item_attributes: "id, rfq_item_id, group_id, attribute_id",
      seller_quotes: "id, rfq_item_id, seller_party_id, status",
      seller_quote_attributes: "id, seller_quote_id, group_id, attribute_id",
      seller_quote_comments: "id, seller_quote_id, group_id, attribute_id, actor_id",
      rfq_awards: "id, rfq_id, rfq_item_id, seller_party_id",
    });
  }
}

export const rfqDb = new RfqDatabase();
