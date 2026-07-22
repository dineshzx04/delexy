import { db } from './db';
import { workspaces } from './mockData/workspaces';
import { values } from './mockData/attributeValues';
import { attributes } from './mockData/attributes';
import { groups } from './mockData/attributeGroups';
import { categories } from './mockData/categories';
import { categoryProducts } from './mockData/categoryProducts';
import { userProducts } from './mockData/userProducts';
import { userProductReviews } from './mockData/userProductReviews';
import { rfqs } from './mockData/rfqs';

export const seedDatabase = async () => {
  try {
    // Check if already seeded by looking for workspaces
    const count = await db.workspaces.count();
    if (count > 0) {
      console.log('Database already seeded.');
      return;
    }

    console.log('Seeding Mock Database...');

    // 1. Seed Workspaces
    await db.workspaces.bulkAdd(workspaces);

    // 2. Seed Attribute Values
    await db.attributeValues.bulkAdd(values);

    // 3. Seed Attributes
    await db.attributes.bulkAdd(attributes as any);

    // 4. Seed Attribute Groups
    await db.attributeGroups.bulkAdd(groups as any);

    // 5. Seed Categories
    await db.categories.bulkAdd(categories as any);

    // 6. Seed Platform Products
    await db.categoryProducts.bulkAdd(categoryProducts as any);

    // 7. Seed User Products & Reviews
    await db.userProducts.bulkAdd(userProducts as any);
    await db.userProductReviews.bulkAdd(userProductReviews as any);

    // 8. Seed RFQs
    await db.rfqs.bulkAdd(rfqs as any);

    console.log('Mock database seeded successfully.');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};
