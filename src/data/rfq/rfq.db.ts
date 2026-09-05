import Dexie, { type Table } from "dexie";
import type {
  Rfq,
  RfqItem,
  RfqItemAttribute,
  SellerQuote,
  SellerQuoteAttribute,
  SellerQuoteVariant,
  SellerQuoteSuggestedVariant,
  SellerQuoteComment,
  SellerQuoteAttributeComment,
  SellerQuoteVariantComment,
  RfqQuoteAward,
  RfqQuoteVariantAward,
  AwardRevisionHistory,
  PurchaseOrder,
  PurchaseOrderItem,
  PoAcknowledgement,
} from "./rfq.module";

export class RfqDatabase extends Dexie {
  rfqs!: Table<Rfq, string>;
  rfq_items!: Table<RfqItem, string>;
  rfq_item_attributes!: Table<RfqItemAttribute, string>;
  seller_quotes!: Table<SellerQuote, string>;
  seller_quote_attributes!: Table<SellerQuoteAttribute, string>;
  seller_quote_variants!: Table<SellerQuoteVariant, string>;
  seller_quote_suggested_variants!: Table<SellerQuoteSuggestedVariant, string>;
  seller_quote_comments!: Table<SellerQuoteComment, string>;
  seller_quote_attribute_comments!: Table<SellerQuoteAttributeComment, string>;
  seller_quote_variant_comments!: Table<SellerQuoteVariantComment, string>;
  rfq_quote_awards!: Table<RfqQuoteAward, string>;
  rfq_quote_variant_awards!: Table<RfqQuoteVariantAward, string>;
  award_revision_history!: Table<AwardRevisionHistory, string>;
  purchase_orders!: Table<PurchaseOrder, string>;
  purchase_order_items!: Table<PurchaseOrderItem, string>;
  po_acknowledgements!: Table<PoAcknowledgement, string>;

  constructor() {
    super("delexy_rfq_db");
    this.version(14).stores({
      rfqs: "id, status, requester_id, requester_party_id",
      rfq_items: "id, rfq_id, category_id",
      rfq_item_attributes: "id, rfq_item_id, group_id, attribute_id",
      seller_quotes: "id,rfq_id, rfq_item_id, seller_party_id, status, [rfq_item_id+seller_party_id]",
      seller_quote_attributes: "id, seller_quote_id, group_id, attribute_id",
      seller_quote_variants: "id, seller_quote_id",
      seller_quote_suggested_variants: "id, seller_quote_id, variant_id, seller_product_id",
      seller_quote_comments: "id, seller_quote_id, group_id, attribute_id, actor_id",
      seller_quote_attribute_comments: "id, seller_quote_id, group_id, attribute_id, actor_id",
      seller_quote_variant_comments: "id, seller_quote_id, variant_id, actor_id",
      rfq_award_headers: "id, rfq_id, process_status",
      rfq_award_items: "id, award_header_id, rfq_id, rfq_item_id, seller_party_id, seller_quote_id, seller_accepted, award_item_status, award_round",
      award_revision_history: "id, rfq_id, rfq_item_id, seller_party_id, award_round",
      purchase_orders: "id, po_number, rfq_id, award_header_id, buyer_party_id, seller_party_id, po_status",
      purchase_order_items: "id, purchase_order_id, award_item_id, rfq_item_id",
      po_acknowledgements: "id, purchase_order_id, seller_party_id",
    });

    this.version(15).stores({
      rfq_award_headers: null,
      rfq_award_items: null,
      rfq_quote_awards: "id, rfq_id, rfq_item_id, seller_quote_id, seller_party_id, award_status, [rfq_id+seller_party_id]",
      rfq_quote_variant_awards: "id, quote_award_id, rfq_id, rfq_item_id, seller_quote_id, seller_party_id, variant_id, variant_award_status, product_mapping_status",
      purchase_orders: "id, po_number, rfq_id, quote_award_id, buyer_party_id, seller_party_id, po_status",
      purchase_order_items: "id, purchase_order_id, quote_variant_award_id, rfq_item_id",
      award_revision_history: "id, quote_award_id, quote_variant_award_id, rfq_id, rfq_item_id, seller_party_id, award_round",
    });
  }
}

export const rfqDb = new RfqDatabase();
