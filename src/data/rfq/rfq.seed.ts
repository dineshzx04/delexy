import { rfqDb } from "./rfq.db";
import { mockRfqs } from "./rfqs";
import { mockRfqItems } from "./rfqItems";
import { mockRfqItemAttributes } from "./rfqItemAttributes";
import { mockSellerQuotes } from "./sellerQuotes";
import { mockSellerQuoteAttributes } from "./sellerQuoteAttributes";
import { mockSellerQuoteComments } from "./sellerQuoteComments";
// import { mockRfqAwards } from "./rfqAwards";

const runBulkSeed = async () => {
  await rfqDb.rfqs.clear();
  await rfqDb.rfq_items.clear();
  await rfqDb.rfq_item_attributes.clear();
  await rfqDb.seller_quotes.clear();
  await rfqDb.seller_quote_attributes.clear();
  await rfqDb.seller_quote_comments.clear();
  // await rfqDb.rfq_awards.clear();

  await rfqDb.rfqs.bulkPut(mockRfqs);
  await rfqDb.rfq_items.bulkPut(mockRfqItems);
  await rfqDb.rfq_item_attributes.bulkPut(mockRfqItemAttributes);
  await rfqDb.seller_quotes.bulkPut(mockSellerQuotes);
  await rfqDb.seller_quote_attributes.bulkPut(mockSellerQuoteAttributes);
  await rfqDb.seller_quote_comments.bulkPut(mockSellerQuoteComments);
  // await rfqDb.rfq_awards.bulkPut(mockRfqAwards);
};


export const seedRfqModule = async () => {
  try {
    const items = await rfqDb.rfq_items.toArray();
    if (items.length === 0) {
      console.log("--- Seeding Normalized RFQ Sourcing Database ---");
      await runBulkSeed();
      console.log("--- RFQ Sourcing Database Seeded Successfully ---");
    } else {
      console.log(
        "[RFQ Module] Database already populated with lifecycle RFQ records. Skipping seed.",
      );
    }
  } catch (error) {
    console.error("Error seeding RFQ sourcing database:", error);
  }
};
