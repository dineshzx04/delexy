import Dexie, { type Table } from 'dexie';
import type { Category, AttributeGroup, Attribute, AttributeValue, Product } from './catelog.module';

export class CatalogDatabase extends Dexie {
  categories!: Table<Category, string>;
  attributeGroups!: Table<AttributeGroup, string>;
  attributes!: Table<Attribute, string>;
  attributeValues!: Table<AttributeValue, string>;
  products!: Table<Product, string>;

  constructor() {
    super('DelexyCatalogDB');
    this.version(1).stores({
      categories: 'id, parentId, slug',
      attributeGroups: 'id',
      attributes: 'id',
      attributeValues: 'id, attributeId',
      products: 'id, categoryId',
    });
  }
}

export const catalogDb = new CatalogDatabase();
