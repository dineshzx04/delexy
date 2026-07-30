import Dexie, { type Table } from 'dexie';
import type { CatalogCategory, AttributeGroup, Attribute, AttributeValue, CatalogProduct, SellerProduct } from './catalog.module';

export class CatalogDatabase extends Dexie {
  categories!: Table<CatalogCategory, string>;
  attributeGroups!: Table<AttributeGroup, string>;
  attributes!: Table<Attribute, string>;
  attributeValues!: Table<AttributeValue, string>;
  products!: Table<CatalogProduct, string>;
  sellerProducts!: Table<SellerProduct, string>;

  constructor() {
    super('delexy_catalog_db');
    this.version(1).stores({
      categories: 'id, parentId, slug',
      attributeGroups: 'id',
      attributes: 'id',
      attributeValues: 'id, attributeId',
      products: 'id, categoryId, status',
      sellerProducts: 'id, seller_party_id, product_id, brand_id, manufacturer_party_id, sku',
    });
  }
}

export const catalogDb = new CatalogDatabase();
