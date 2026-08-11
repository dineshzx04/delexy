import Dexie, { type Table } from "dexie";
import type {
  Rfq,
  RfqItem,
  RfqItemRevision,
  RfqItemAttribute,
  SellerQuote,
  SellerQuoteRevision,
  SellerQuoteAttribute,
  SellerQuoteComment,
  ItemAttributeChangeHistory,
  RfqAward,
} from "./rfq.module";

export class RfqDatabase extends Dexie {
  rfqs!: Table<Rfq, string>;
  rfq_items!: Table<RfqItem, string>;
  rfq_item_revisions!: Table<RfqItemRevision, string>;
  rfq_item_attributes!: Table<RfqItemAttribute, string>;
  seller_quotes!: Table<SellerQuote, string>;
  seller_quote_revisions!: Table<SellerQuoteRevision, string>;
  seller_quote_attributes!: Table<SellerQuoteAttribute, string>;
  seller_quote_comments!: Table<SellerQuoteComment, string>;
  item_attribute_change_history!: Table<ItemAttributeChangeHistory, string>;
  rfq_awards!: Table<RfqAward, string>;
 
  constructor() {
    super("delexy_rfq_db");
    this.version(7).stores({
      rfqs: "id, status, requester_id, requester_party_id ",
      rfq_items: "id, rfq_id, category_id, current_revision_id",
      rfq_item_revisions: "id, rfq_item_id, revision_number",
      rfq_item_attributes: "id, rfq_item_revision_id, group_id, attribute_id",
      seller_quotes: "id, rfq_item_id, seller_id, current_revision_id, status",
      seller_quote_revisions: "id, seller_quote_id, rfq_item_revision_id, revision_number",
      seller_quote_attributes: "id, quote_revision_id, item_attribute_id, group_id, attribute_id",
      seller_quote_comments: "id, seller_quote_id, quote_attribute_id, sender_id",
      item_attribute_change_history: "id, rfq_item_id, seller_quote_id, round, group_id, attribute_id, actor_type",
      rfq_awards: "id, rfq_id, rfq_item_id, seller_party_id",
     });
  }
}

export const rfqDb = new RfqDatabase();
