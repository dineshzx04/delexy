import Dexie, { type Table } from "dexie";
import type {
  Rfq,
  RfqItem,
  ItemAttribute,
  SellerQuote,
  SellerAttributeResponse,
  ItemAttributeComment,
  ItemAttributeChangeHistory,
  RfqAward,
} from "./rfq.module";

export class RfqDatabase extends Dexie {
  rfqs!: Table<Rfq, string>;
  rfqItems!: Table<RfqItem, string>;
  itemAttributes!: Table<ItemAttribute, string>;
  sellerQuote!: Table<SellerQuote, string>;
  sellerAttributeResponses!: Table<SellerAttributeResponse, string>;
  itemAttributeComments!: Table<ItemAttributeComment, string>;
  itemAttributeChangeHistory!: Table<ItemAttributeChangeHistory, string>;
  rfqAwards!: Table<RfqAward, string>;

  // Backward compatibility getters for existing callers
  get attributeComments(): Table<ItemAttributeComment, string> {
    return this.itemAttributeComments;
  }

  get attributeResponseHistory(): Table<ItemAttributeChangeHistory, string> {
    return this.itemAttributeChangeHistory;
  }

  // Kept for legacy compatibility so type checks in code referencing db.ts don't instantly break
  itemSupplierResponses!: Table<any, string>;

  constructor() {
    super("delexy_rfq_db");
    this.version(5).stores({
      rfqs: "id, status, requester_party_id",
      rfqItems: "id, rfq_id, categoryId, itemRevision",
      itemAttributes: "id, itemId, groupId, attributeId",
      sellerQuote: "id, itemId, sellerId, itemRevision, status",
      sellerAttributeResponses: "id, quoteId, groupId, attributeId",
      itemAttributeComments: "id, itemId, quoteId, groupId, attributeId, round",
      itemAttributeChangeHistory:
        "id, itemId, quoteId, round, groupId, attributeId, actorType",
      rfqAwards: "id, rfqId, itemId, sellerId",
      itemSupplierResponses: "id, rfq_id, rfq_item_id, seller_party_id, status",
    });
  }
}

export const rfqDb = new RfqDatabase();
