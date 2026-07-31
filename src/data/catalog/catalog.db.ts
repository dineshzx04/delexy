import Dexie, { type Table } from 'dexie';
import type { CatalogCategory, AttributeGroup, Attribute, AttributeValue, CatalogProduct, SellerProduct, SellerProductSubmission } from './catalog.module';

export class CatalogDatabase extends Dexie {
  categories!: Table<CatalogCategory, string>;
  attributeGroups!: Table<AttributeGroup, string>;
  attributes!: Table<Attribute, string>;
  attributeValues!: Table<AttributeValue, string>;
  products!: Table<CatalogProduct, string>;
  sellerProducts!: Table<SellerProduct, string>;
  sellerProductSubmissions!: Table<SellerProductSubmission, string>;

  constructor() {
    super('delexy_catalog_db');
    this.version(1).stores({
      categories: 'id, parentId, slug',
      attributeGroups: 'id',
      attributes: 'id',
      attributeValues: 'id, attributeId',
      products: 'id, categoryId, status',
      sellerProducts: 'id, party_id, catalog_product_id, brand_id, manufacturer_id, sku',
      sellerProductSubmissions: 'id, party_id, status, current_round',
    });
  }
}

export const catalogDb = new CatalogDatabase();
