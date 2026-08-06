import { rfqDb } from './rfq.db';
import { mockRfqs } from './rfqs';
import { mockRfqItems } from './rfqItems';
import { mockItemAttributes } from './itemAttributes';
import { mockSellerQuotes } from './sellerQuote';
import { mockSellerAttributeResponses } from './sellerAttributeResponses';
import { mockAttributeComments } from './attributeComments';
import { mockAttributeResponseHistories } from './attributeResponseHistory';
import { mockRfqAwards } from './rfqAwards';

export const seedRfqModule = async () => {
  try {
    const rfqCount = await rfqDb.rfqs.count();
    if (rfqCount === 0) {
      console.log('--- Seeding Normalized RFQ Sourcing Database ---');

      await rfqDb.rfqs.bulkPut(mockRfqs);
      await rfqDb.rfqItems.bulkPut(mockRfqItems);
      await rfqDb.itemAttributes.bulkPut(mockItemAttributes);
      await rfqDb.sellerQuote.bulkPut(mockSellerQuotes);
      await rfqDb.sellerAttributeResponses.bulkPut(mockSellerAttributeResponses);
      await rfqDb.attributeComments.bulkPut(mockAttributeComments);
      await rfqDb.attributeResponseHistory.bulkPut(mockAttributeResponseHistories);
      await rfqDb.rfqAwards.bulkPut(mockRfqAwards);

      console.log('--- RFQ Sourcing Database Seeded Successfully ---');
    } else {
      console.log('[RFQ Module] Database already populated with RFQ records. Skipping seed.');
    }
  } catch (error) {
    console.error('Error seeding RFQ sourcing database:', error);
  }
};
