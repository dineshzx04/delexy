import { catalogDb } from './catalog.db';
import { mockCategories } from './categories';
import { mockAttributeGroups } from './attributeGroups';
import { mockAttributes } from './attributes';
import { mockAttributeValues } from './attributeValues';
import { mockProducts } from './products';
import { mockProductCategories } from './productCategories';
import { mockSellerProducts } from './sellerProducts';

export {
  mockCategories,
  mockAttributeGroups,
  mockAttributes,
  mockAttributeValues,
  mockProducts,
  mockProductCategories,
  mockSellerProducts
};

export const seedCatalogModule = async () => {
  const count = await catalogDb.products.count();
  if (count === 0) {
    await catalogDb.categories.bulkPut(mockCategories);
    await catalogDb.attributeGroups.bulkPut(mockAttributeGroups);
    await catalogDb.attributes.bulkPut(mockAttributes);
    await catalogDb.attributeValues.bulkPut(mockAttributeValues);
    await catalogDb.products.bulkPut(mockProducts);
    await catalogDb.productCategories.bulkPut(mockProductCategories);
    await catalogDb.sellerProducts.bulkPut(mockSellerProducts);
    console.log('[Catalog Module] Database seeded successfully.');
  }
};
