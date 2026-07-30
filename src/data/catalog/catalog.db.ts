import Dexie, { type Table } from 'dexie';
import type { Category, AttributeGroup, Attribute, AttributeValue, Product, ProductCategory, SellerProduct } from './catalog.module';

export class CatalogDatabase extends Dexie {
  categories!: Table<Category, string>;
  attributeGroups!: Table<AttributeGroup, string>;
  attributes!: Table<Attribute, string>;
  attributeValues!: Table<AttributeValue, string>;
  products!: Table<Product, string>;
  productCategories!: Table<ProductCategory, string>;
  sellerProducts!: Table<SellerProduct, string>;

  constructor() {
    super('delexy_catalog_db');
    this.version(1).stores({
      categories: 'id, parentId, slug',
      attributeGroups: 'id',
      attributes: 'id',
      attributeValues: 'id, attributeId',
      products: 'id, status',
      productCategories: 'id, product_id, category_id',
      sellerProducts: 'id, seller_party_id, product_id, brand_id, manufacturer_party_id, sku',
    });
  }
}

export const catalogDb = new CatalogDatabase();
