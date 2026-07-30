import type { SellerProduct } from './catalog.module';

export const mockSellerProducts: SellerProduct[] = [
  // Seller 1: Business Samsung India (pty-1) selling Samsung Galaxy S24 Ultra (prod-2)
  {
    id: 'sprod-1',
    seller_party_id: 'pty-1',
    product_id: 'prod-2',
    brand_id: 'brd-1',
    manufacturer_party_id: 'pty-1',
    sku: 'SM-S928B-512',
    barcode: '880609536892',
    price: 1299.99,
    currency: 'USD',
    stock: 50,
    status: 'ACTIVE',
    dynamicAttributes: {
      'attr-7': 'val-7-1',
      'attr-8': 'val-8-1',
      'attr-9': 'val-9-1',
      'attr-10': 'val-10-1',
      'attr-11': 'val-11-1',
      'attr-12': 'val-12-1'
    },
    globalSpecs: {
      model_number: 'SM-S928B/DS',
      part_number: 'GH90-15822A'
    },
    created_at: '2026-01-15T08:00:00.000Z',
    updated_at: '2026-01-15T08:00:00.000Z'
  },
  // Seller 2: Individual User John Doe (pty-6) selling ASUS ROG Strix (prod-1) without owning ASUS brand/manufacturer
  {
    id: 'sprod-2',
    seller_party_id: 'pty-6',
    product_id: 'prod-1',
    brand_id: 'brd-2',
    manufacturer_party_id: 'pty-5',
    sku: 'G634JZ-XS96',
    barcode: '197105088204',
    price: 2499.99,
    currency: 'USD',
    stock: 25,
    status: 'ACTIVE',
    dynamicAttributes: {
      'attr-1': 'val-1-1',
      'attr-2': 'val-2-1',
      'attr-3': 'val-3-1',
      'attr-4': 'val-4-1',
      'attr-5': 'val-5-1',
      'attr-6': 'val-6-1'
    },
    globalSpecs: {
      model_number: 'G634JZ-XS96',
      part_number: '90NR0CC1-M001B0'
    },
    created_at: '2026-01-15T08:00:00.000Z',
    updated_at: '2026-01-15T08:00:00.000Z'
  },
  // Seller 3: Individual User John Doe (pty-6) selling ASICS Shoes (prod-3) under unclaimed placeholder ASICS brand & manufacturer (pty-3)
  {
    id: 'sprod-3',
    seller_party_id: 'pty-6',
    product_id: 'prod-3',
    brand_id: 'brd-4',
    manufacturer_party_id: 'pty-3',
    sku: '1011B798-001-10',
    barcode: '455045612345',
    price: 159.99,
    currency: 'USD',
    stock: 100,
    status: 'ACTIVE',
    dynamicAttributes: {
      'attr-13': 'val-13-1',
      'attr-14': 'val-14-1',
      'attr-15': 'val-15-1',
      'attr-16': 'val-16-1',
      'attr-17': 'val-17-1',
      'attr-18': 'val-18-1'
    },
    globalSpecs: {
      model_number: '1011B798-001',
      part_number: 'AS-G26-PRO'
    },
    created_at: '2026-05-10T08:00:00.000Z',
    updated_at: '2026-05-10T08:00:00.000Z'
  },
  // Seller 4: Business C (pty-4) selling Sony Alpha 7 IV (prod-4)
  {
    id: 'sprod-4',
    seller_party_id: 'pty-4',
    product_id: 'prod-4',
    brand_id: 'brd-3',
    manufacturer_party_id: 'pty-2',
    sku: 'ILCE-7M4-BODY',
    barcode: '027242923584',
    price: 2498.00,
    currency: 'USD',
    stock: 15,
    status: 'ACTIVE',
    dynamicAttributes: {
      'attr-19': 'val-19-1',
      'attr-20': 'val-20-1',
      'attr-21': 'val-21-1',
      'attr-22': 'val-22-1',
      'attr-23': 'val-23-1',
      'attr-24': 'val-24-1'
    },
    globalSpecs: {
      model_number: 'ILCE-7M4/B',
      part_number: 'SY-A7M4-BODY'
    },
    created_at: '2026-01-15T08:00:00.000Z',
    updated_at: '2026-01-15T08:00:00.000Z'
  }
];
