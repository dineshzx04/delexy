import Dexie, { type Table } from "dexie";
import type {
  Rfq,
  RfqItem,
  ItemAttribute,
  SellerQuote,
  SellerAttributeResponse,
  AttributeComment,
  AttributeResponseHistory,
  RfqAward,
} from "./rfq.module";

export class RfqDatabase extends Dexie {
  rfqs!: Table<Rfq, string>;
  rfqItems!: Table<RfqItem, string>;
  itemAttributes!: Table<ItemAttribute, string>;
  sellerQuote!: Table<SellerQuote, string>;
  sellerAttributeResponses!: Table<SellerAttributeResponse, string>;
  attributeComments!: Table<AttributeComment, string>;
  attributeResponseHistory!: Table<AttributeResponseHistory, string>;
  rfqAwards!: Table<RfqAward, string>;

  // Kept for legacy compatibility so type checks in code referencing db.ts don't instantly break
  itemSupplierResponses!: Table<any, string>;

  constructor() {
    super("delexy_rfq_db");
    this.version(3).stores({
      rfqs: "id, status, requester_party_id",
      rfqItems: "id, rfq_id, categoryId, itemRevision",
      itemAttributes: "id, itemId, groupId, attributeId",
      sellerQuote: "id, itemId, sellerId, itemRevision, status",
      sellerAttributeResponses: "id, quoteId, groupId, attributeId",
      attributeComments: "id, quoteId, groupId, attributeId, round",
      attributeResponseHistory:
        "id, responseId, quoteId, round, groupId, attributeId",
      rfqAwards: "id, rfqId, itemId, sellerId",
      // Register legacy table index to prevent runtime crashes during DB creation
      itemSupplierResponses: "id, rfq_id, rfq_item_id, seller_party_id, status",
    });
  }
}

export const rfqDb = new RfqDatabase();
