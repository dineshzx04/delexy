import { rfqDb } from './rfq.db';
import { mockRfqs } from './rfqs';
import { mockRfqItems } from './rfqItems';
import { mockItemSupplierResponses } from './rfqResponses';
import { mockRfqAwards } from './rfqAwards';

export const seedRfqModule = async () => {
  try {
    const rfqCount = await rfqDb.rfqs.count();
    if (rfqCount === 0) {
      console.log('--- Seeding RFQ Sourcing Database ---');

      await rfqDb.rfqs.bulkPut(mockRfqs);
      await rfqDb.rfqItems.bulkPut(mockRfqItems);
      await rfqDb.itemSupplierResponses.bulkPut(mockItemSupplierResponses);
      await rfqDb.rfqAwards.bulkPut(mockRfqAwards);

      console.log('--- RFQ Sourcing Database Seeded Successfully ---');
    } else {
      console.log('[RFQ Module] Database already populated with RFQ records. Skipping seed.');
    }
  } catch (error) {
    console.error('Error seeding RFQ sourcing database:', error);
  }
};
