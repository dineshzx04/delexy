import type { CatalogCategory } from './catalog.module';

export const mockCategories: CatalogCategory[] = [
  // Electronics Hierarchy
  { id: 'c-1', name: 'Electronics', slug: 'electronics', isActive: true, parentId: null, mappedGroupIds: [] },
  { id: 'c-2', name: 'Computers & Laptops', slug: 'computers-laptops', isActive: true, parentId: 'c-1', mappedGroupIds: [] },
  { id: 'c-2-1', name: 'Laptops', slug: 'laptops', isActive: true, parentId: 'c-2', mappedGroupIds: [] },
  { id: 'c-2-1-1', name: 'Gaming Laptops', slug: 'gaming-laptops', isActive: true, parentId: 'c-2-1', mappedGroupIds: ['grp-1', 'grp-2', 'grp-3'] },

  { id: 'c-3', name: 'Mobile Communications', slug: 'mobile-communications', isActive: true, parentId: 'c-1', mappedGroupIds: [] },
  { id: 'c-3-1', name: 'Smartphones', slug: 'smartphones', isActive: true, parentId: 'c-3', mappedGroupIds: [] },
  { id: 'c-3-1-1', name: 'Flagship Smartphones', slug: 'flagship-smartphones', isActive: true, parentId: 'c-3-1', mappedGroupIds: ['grp-4', 'grp-5', 'grp-6'] },

  // Apparel Hierarchy
  { id: 'c-4', name: 'Apparel & Fashion', slug: 'apparel-fashion', isActive: true, parentId: null, mappedGroupIds: [] },
  { id: 'c-4-1', name: 'Footwear', slug: 'footwear', isActive: true, parentId: 'c-4', mappedGroupIds: [] },
  { id: 'c-4-1-1', name: 'Athletic Shoes', slug: 'athletic-shoes', isActive: true, parentId: 'c-4-1', mappedGroupIds: [] },
  { id: 'c-4-1-1-1', name: 'Pro Running Shoes', slug: 'pro-running-shoes', isActive: true, parentId: 'c-4-1-1', mappedGroupIds: ['grp-7', 'grp-8', 'grp-9'] },

  // Cameras Hierarchy
  { id: 'c-5', name: 'Cameras & Optics', slug: 'cameras-optics', isActive: true, parentId: 'c-1', mappedGroupIds: [] },
  { id: 'c-5-1', name: 'Digital Cameras', slug: 'digital-cameras', isActive: true, parentId: 'c-5', mappedGroupIds: [] },
  { id: 'c-5-1-1', name: 'Mirrorless Cameras', slug: 'mirrorless-cameras', isActive: true, parentId: 'c-5-1', mappedGroupIds: ['grp-10', 'grp-11', 'grp-12'] }
];
