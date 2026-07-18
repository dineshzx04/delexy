import { db } from './db';
import { getRFQs } from './mockRFQs';
import { getProducts } from './mockProducts';

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
    const workspaces = [
      { id: 'ind-1', name: 'John Personal', type: 'individual' as const, role: 'Individual User' },
      { id: 'org-1', name: 'ABC Engineering Pvt Ltd', type: 'tenant' as const, role: 'Organization Owner' },
      { id: 'org-2', name: 'XYZ Manufacturing Ltd', type: 'tenant' as const, role: 'Procurement Manager' },
      { id: 'org-3', name: 'Global Suppliers Inc', type: 'tenant' as const, role: 'Supplier' },
      { id: 'plat-1', name: 'Platform Workspace', type: 'platform' as const, role: 'System Administrator' },
    ];
    await db.workspaces.bulkAdd(workspaces);

    // 2. Seed Attribute Values
    const values = [
      { id: 'val-1', value: '15 inch' },
      { id: 'val-2', value: '13 inch' },
      { id: 'val-3', value: 'M2' },
      { id: 'val-4', value: 'M1' },
      { id: 'val-5', value: '16GB' },
      { id: 'val-6', value: '8GB' }
    ];
    await db.attributeValues.bulkAdd(values);

    // 3. Seed Attributes
    const attributes = [
      { id: 'attr-1', name: 'Screen Size', type: 'select' as const, valueIds: ['val-1', 'val-2'] },
      { id: 'attr-2', name: 'Processor', type: 'select' as const, valueIds: ['val-3', 'val-4'] },
      { id: 'attr-3', name: 'RAM', type: 'select' as const, valueIds: ['val-5', 'val-6'] },
      { id: 'attr-4', name: 'Weight', type: 'number' as const, valueIds: [] },
      { id: 'attr-5', name: 'Touchscreen', type: 'boolean' as const, valueIds: [] }
    ];
    await db.attributes.bulkAdd(attributes);

    // 4. Seed Attribute Groups
    const groups = [
      { id: 'g1', name: 'Display Specs', attributeIds: ['attr-1', 'attr-5'] },
      { id: 'g2', name: 'Performance Specs', attributeIds: ['attr-2', 'attr-3'] },
      { id: 'g3', name: 'Physical Specs', attributeIds: ['attr-4'] }
    ];
    await db.attributeGroups.bulkAdd(groups);

    // 5. Seed Categories
    const categories = [
      { id: 'c-1', name: 'Electronics', slug: 'electronics', isActive: true, parentId: null, mappedGroupIds: [] },
      { id: 'c-1-1', name: 'Computers', slug: 'computers', isActive: true, parentId: 'c-1', mappedGroupIds: [] },
      { id: 'c-1-1-1-1', name: 'Laptops', slug: 'laptops', isActive: true, parentId: 'c-1-1', mappedGroupIds: ['g1', 'g2', 'g3'] },
      { id: 'c-1-1-1-2', name: 'Desktops', slug: 'desktops', isActive: true, parentId: 'c-1-1', mappedGroupIds: ['g2'] },
      { id: 'c-2', name: 'Industrial', slug: 'industrial', isActive: true, parentId: null, mappedGroupIds: [] },
      { id: 'c-2-2-1-1', name: 'Motors', slug: 'motors', isActive: true, parentId: 'c-2', mappedGroupIds: [] },
    ];
    await db.categories.bulkAdd(categories);

    // 6. Seed Platform Products
    const platformProducts = [
      { id: 'pp-1', categoryId: 'c-1-1-1-1', name: 'MacBook Pro 14', brand: 'Apple', manufacturer: 'Foxconn', globalSpecs: { 'Processor': 'M2 Pro', 'RAM': '16GB' } },
      { id: 'pp-2', categoryId: 'c-1-1-1-2', name: 'iMac 24', brand: 'Apple', manufacturer: 'Foxconn', globalSpecs: { 'Processor': 'M1', 'RAM': '8GB' } },
      { id: 'pp-3', categoryId: 'c-2-2-1-1', name: 'Industrial Motor AC', brand: 'Acme', manufacturer: 'Acme Corp', globalSpecs: { 'Power': '5HP' } }
    ];
    await db.platformProducts.bulkAdd(platformProducts);

    // 7. Seed User Products (from mockProducts.ts)
    const userProducts = getProducts();
    await db.userProducts.bulkAdd(userProducts as any);

    // 8. Seed RFQs (from mockRFQs.ts)
    const rfqs = getRFQs();
    await db.rfqs.bulkAdd(rfqs as any);

    console.log('Mock Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};
