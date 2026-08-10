import Dexie from "dexie";
import { rfqDb } from "./rfq.db";
import { mockRfqs } from "./rfqs";
import { mockRfqItems } from "./rfqItems";
import { mockItemAttributes } from "./itemAttributes";
import { mockSellerQuotes } from "./sellerQuote";
import { mockSellerAttributeResponses } from "./sellerAttributeResponses";
import { mockItemAttributeComments } from "./itemAttributeComments";
import { mockItemAttributeChangeHistories } from "./itemAttributeChangeHistory";
import { mockRfqAwards } from "./rfqAwards";

const runBulkSeed = async () => {
  await rfqDb.rfqs.clear();
  await rfqDb.rfqItems.clear();
  await rfqDb.itemAttributes.clear();
  await rfqDb.sellerQuote.clear();
  await rfqDb.sellerAttributeResponses.clear();
  await rfqDb.itemAttributeComments.clear();
  await rfqDb.itemAttributeChangeHistory.clear();
  await rfqDb.rfqAwards.clear();

  await rfqDb.rfqs.bulkPut(mockRfqs);
  await rfqDb.rfqItems.bulkPut(mockRfqItems);
  await rfqDb.itemAttributes.bulkPut(mockItemAttributes);
  await rfqDb.sellerQuote.bulkPut(mockSellerQuotes);
  await rfqDb.sellerAttributeResponses.bulkPut(mockSellerAttributeResponses);
  await rfqDb.itemAttributeComments.bulkPut(mockItemAttributeComments);
  await rfqDb.itemAttributeChangeHistory.bulkPut(mockItemAttributeChangeHistories);
  await rfqDb.rfqAwards.bulkPut(mockRfqAwards);
};

export const seedRfqModule = async () => {
  try {
    const item01 = await rfqDb.rfqItems.toArray();
    if (item01.length === 0) {
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
