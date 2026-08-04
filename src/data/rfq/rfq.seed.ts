import { rfqDb } from './rfq.db';
import { mockRfqs } from './rfqs';
import { mockRfqItems } from './rfqItems';
import { mockItemSupplierResponses } from './rfqResponses';
import { mockRfqAwards } from './rfqAwards';

export const seedRfqModule = async () => {
  try {
    console.log('--- Seeding RFQ Sourcing Database ---');

    await rfqDb.rfqs.clear();
    await rfqDb.rfqItems.clear();
    await rfqDb.itemSupplierResponses.clear();
    await rfqDb.rfqAwards.clear();

    await rfqDb.rfqs.bulkPut(mockRfqs);
    await rfqDb.rfqItems.bulkPut(mockRfqItems);
    await rfqDb.itemSupplierResponses.bulkPut(mockItemSupplierResponses);
    await rfqDb.rfqAwards.bulkPut(mockRfqAwards);

    console.log('--- RFQ Sourcing Database Seeded Successfully ---');
  } catch (error) {
    console.error('Error seeding RFQ sourcing database:', error);
  }
};
