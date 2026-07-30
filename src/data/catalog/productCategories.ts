import type { ProductCategory } from './catalog.module';

export const mockProductCategories: ProductCategory[] = [
  { id: 'pc-1', product_id: 'prod-1', category_id: 'c-2-1-1', created_at: '2026-01-15T08:00:00.000Z' },
  { id: 'pc-2', product_id: 'prod-2', category_id: 'c-3-1-1', created_at: '2026-01-15T08:00:00.000Z' },
  { id: 'pc-3', product_id: 'prod-3', category_id: 'c-4-1-1-1', created_at: '2026-01-15T08:00:00.000Z' },
  { id: 'pc-4', product_id: 'prod-4', category_id: 'c-5-1-1', created_at: '2026-01-15T08:00:00.000Z' }
];
