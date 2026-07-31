import { catalogDb } from './catalog.db';
import { mockCategories } from './categories';
import { mockAttributeGroups } from './attributeGroups';
import { mockAttributes } from './attributes';
import { mockAttributeValues } from './attributeValues';
import { mockProducts } from './products';
import { mockSellerProducts } from './sellerProducts';
import { mockSellerProductSubmissions } from './sellerProductSubmissions';

export {
  mockCategories,
  mockAttributeGroups,
  mockAttributes,
  mockAttributeValues,
  mockProducts,
  mockSellerProducts,
  mockSellerProductSubmissions
};

export const seedCatalogModule = async () => {
  const count = await catalogDb.products.count();
  if (count === 0) {
    await catalogDb.categories.bulkPut(mockCategories);
    await catalogDb.attributeGroups.bulkPut(mockAttributeGroups);
    await catalogDb.attributes.bulkPut(mockAttributes);
    await catalogDb.attributeValues.bulkPut(mockAttributeValues);
    await catalogDb.products.bulkPut(mockProducts);
    await catalogDb.sellerProducts.bulkPut(mockSellerProducts);
    await catalogDb.sellerProductSubmissions.bulkPut(mockSellerProductSubmissions);
    console.log('[Catalog Module] Database seeded successfully.');
  } else {
    // Seed submissions if empty
    const subCount = await catalogDb.sellerProductSubmissions.count();
    if (subCount === 0) {
      await catalogDb.sellerProductSubmissions.bulkPut(mockSellerProductSubmissions);
    }
  }
};
