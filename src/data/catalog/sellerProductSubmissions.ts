import type { SellerProductSubmission } from './catalog.module';

export const mockSellerProductSubmissions: SellerProductSubmission[] = [
  // 1. Round 1 Submitted Submission for Samsung India Business Party (pty-1)
  {
    id: 'sps-101',
    party_id: 'pty-1', // Samsung India Industrial Party (bus-a)
    status: 'SUBMITTED',
    current_round: 1,
    created_at: '2026-07-28T10:00:00Z',
    updated_at: '2026-07-28T11:00:00Z',
    submitted_at: '2026-07-28T11:00:00Z',
    attributes: {
      category_id: {
        field_key: 'category_id',
        field_label: 'Leaf Category',
        field_group: 'IDENTIFIERS',
        value: 'c-3-1-1', // Flagship Smartphones
        status: 'APPROVED',
        reviewed_by_user_name: 'Super Admin',
        reviewed_at: '2026-07-28T12:00:00Z'
      },
      catalog_product_id: {
        field_key: 'catalog_product_id',
        field_label: 'Master Catalog Product Template',
        field_group: 'IDENTIFIERS',
        value: 'prod-2', // Galaxy S24 Ultra Platform Base
        status: 'APPROVED',
        reviewed_by_user_name: 'Super Admin',
        reviewed_at: '2026-07-28T12:00:00Z'
      },
      product_name: {
        field_key: 'product_name',
        field_label: 'Listing Title',
        field_group: 'IDENTIFIERS',
        value: 'Samsung Galaxy S24 Ultra Enterprise Edition',
        status: 'PENDING'
      },
      manufacturer_id: {
        field_key: 'manufacturer_id',
        field_label: 'Manufacturer',
        field_group: 'IDENTIFIERS',
        value: 'mfg-1', // Samsung India Electronics Pvt Ltd
        status: 'APPROVED',
        reviewed_by_user_name: 'Super Admin',
        reviewed_at: '2026-07-28T12:00:00Z'
      },
      brand_id: {
        field_key: 'brand_id',
        field_label: 'Brand',
        field_group: 'IDENTIFIERS',
        value: 'brd-1', // Samsung
        status: 'APPROVED',
        reviewed_by_user_name: 'Super Admin',
        reviewed_at: '2026-07-28T12:00:00Z'
      },
      specifications: {
        field_key: 'specifications',
        field_label: 'Technical Specifications List',
        field_group: 'SPECS',
        value: [
          {
            group_id: 'grp-4',
            group_name: 'Build & Aesthetics',
            attribute_id: 'attr-8',
            attribute_name: 'Water Resistance',
            values: [{ id: 'val-8-1', label: 'IP68' }]
          },
          {
            group_id: 'grp-5',
            group_name: 'Processing & Memory',
            attribute_id: 'attr-10',
            attribute_name: 'Processor Chipset',
            values: [{ id: 'val-10-1', label: 'Snapdragon 8 Gen 3' }]
          }
        ],
        status: 'PENDING'
      },
      variants: {
        field_key: 'variants',
        field_label: 'Sellable Product Variants',
        field_group: 'VARIANTS',
        value: [
          {
            id: 'sprod-1-v1',
            variant_platform_id: 'gpid-10101',
            sku: 'SM-S928B-BLK-512',
            price: 1299.99,
            currency: 'USD',
            stock: 30,
            min_order_quantity: 1,
            combination_values: [
              { group_id: 'grp-4', group_name: 'Build & Aesthetics', attribute_id: 'attr-7', attribute_name: 'Exterior Finish', value_id: 'val-7-1', label: 'Titanium Black' },
              { group_id: 'grp-5', group_name: 'Processing & Memory', attribute_id: 'attr-9', attribute_name: 'Storage Capacity', value_id: 'val-9-1', label: '512GB' }
            ]
          }
        ],
        status: 'PENDING'
      }
    },
    audit_history: [
      {
        id: 'aud-1',
        round: 1,
        actor_id: 'usr-1',
        actor_name: 'Rajesh Kumar',
        action: 'SUBMITTED',
        notes: 'Submitted initial seller product for platform review.',
        timestamp: '2026-07-28T11:00:00Z'
      }
    ]
  },
  // 2. Submission in NEEDS_REVISION state for John Doe Personal Trading Party (pty-6)
  {
    id: 'sps-102',
    party_id: 'pty-6', // John Doe Personal Trading Party (usr-2)
    status: 'NEEDS_REVISION',
    current_round: 1,
    created_at: '2026-07-29T09:00:00Z',
    updated_at: '2026-07-29T14:00:00Z',
    submitted_at: '2026-07-29T10:00:00Z',
    attributes: {
      category_id: {
        field_key: 'category_id',
        field_label: 'Leaf Category',
        field_group: 'IDENTIFIERS',
        value: 'c-3-1-1', // Flagship Smartphones
        status: 'APPROVED',
        reviewed_by_user_name: 'Super Admin',
        reviewed_at: '2026-07-29T14:00:00Z'
      },
      catalog_product_id: {
        field_key: 'catalog_product_id',
        field_label: 'Master Catalog Product Template',
        field_group: 'IDENTIFIERS',
        value: 'prod-2', // Galaxy S24 Ultra Platform Base
        status: 'APPROVED',
        reviewed_by_user_name: 'Super Admin',
        reviewed_at: '2026-07-29T14:00:00Z'
      },
      product_name: {
        field_key: 'product_name',
        field_label: 'Listing Title',
        field_group: 'IDENTIFIERS',
        value: 'Samsung Galaxy S24 Ultra Unlocked Edition',
        status: 'APPROVED',
        reviewed_by_user_name: 'Super Admin',
        reviewed_at: '2026-07-29T14:00:00Z'
      },
      manufacturer_id: {
        field_key: 'manufacturer_id',
        field_label: 'Manufacturer',
        field_group: 'IDENTIFIERS',
        value: 'mfg-1', // Samsung India Electronics Pvt Ltd
        status: 'APPROVED'
      },
      brand_id: {
        field_key: 'brand_id',
        field_label: 'Brand',
        field_group: 'IDENTIFIERS',
        value: 'brd-1', // Samsung
        status: 'APPROVED'
      },
      specifications: {
        field_key: 'specifications',
        field_label: 'Technical Specifications List',
        field_group: 'SPECS',
        value: [
          {
            group_id: 'grp-4',
            group_name: 'Build & Aesthetics',
            attribute_id: 'attr-7',
            attribute_name: 'Exterior Finish',
            values: [{ id: 'val-7-2', label: 'Titanium Gray' }]
          }
        ],
        status: 'APPROVED'
      },
      variants: {
        field_key: 'variants',
        field_label: 'Sellable Product Variants',
        field_group: 'VARIANTS',
        value: [
          {
            id: 'sprod-102-v1',
            variant_platform_id: 'gpid-10102',
            sku: 'SM-S928B-BLK-1TB',
            price: 1499.99,
            currency: 'USD',
            stock: 15,
            min_order_quantity: 1,
            combination_values: [
              { group_id: 'grp-4', group_name: 'Build & Aesthetics', attribute_id: 'attr-7', attribute_name: 'Exterior Finish', value_id: 'val-7-2', label: 'Titanium Gray' },
              { group_id: 'grp-5', group_name: 'Processing & Memory', attribute_id: 'attr-9', attribute_name: 'Storage Capacity', value_id: 'val-9-2', label: '1TB' }
            ]
          }
        ],
        status: 'APPROVED'
      }
    },
    audit_history: [
      {
        id: 'aud-10',
        round: 1,
        actor_id: 'usr-2',
        actor_name: 'John Doe',
        action: 'SUBMITTED',
        notes: 'Submitted personal seller product.',
        timestamp: '2026-07-29T10:00:00Z'
      },
      {
        id: 'aud-11',
        round: 1,
        actor_id: 'usr-1',
        actor_name: 'Super Admin',
        action: 'REQUESTED_REVISION',
        notes: '2 attributes rejected with comments. Sent back to seller for Round 2 revision.',
        timestamp: '2026-07-29T14:00:00Z'
      }
    ]
  },
  // 3. Submission for ASUSTeK Computer Inc Party (pty-5)
  {
    id: 'sps-103',
    party_id: 'pty-5', // ASUSTeK Computer Inc Party (bus-d)
    status: 'SUBMITTED',
    current_round: 1,
    created_at: '2026-07-30T08:00:00Z',
    updated_at: '2026-07-30T09:00:00Z',
    submitted_at: '2026-07-30T09:00:00Z',
    attributes: {
      category_id: {
        field_key: 'category_id',
        field_label: 'Leaf Category',
        field_group: 'IDENTIFIERS',
        value: 'c-2-1-1', // Gaming Laptops
        status: 'APPROVED',
        reviewed_by_user_name: 'Super Admin',
        reviewed_at: '2026-07-30T10:00:00Z'
      },
      catalog_product_id: {
        field_key: 'catalog_product_id',
        field_label: 'Master Catalog Product Template',
        field_group: 'IDENTIFIERS',
        value: 'prod-1', // ROG Strix SCAR 16 Platform Series
        status: 'APPROVED',
        reviewed_by_user_name: 'Super Admin',
        reviewed_at: '2026-07-30T10:00:00Z'
      },
      product_name: {
        field_key: 'product_name',
        field_label: 'Listing Title',
        field_group: 'IDENTIFIERS',
        value: 'ASUS ROG Strix SCAR 16 Gaming Laptop',
        status: 'PENDING'
      },
      manufacturer_id: {
        field_key: 'manufacturer_id',
        field_label: 'Manufacturer',
        field_group: 'IDENTIFIERS',
        value: 'mfg-4', // ASUSTeK Computer Inc Manufacturing
        status: 'APPROVED'
      },
      brand_id: {
        field_key: 'brand_id',
        field_label: 'Brand',
        field_group: 'IDENTIFIERS',
        value: 'brd-2', // ASUS
        status: 'APPROVED'
      },
      specifications: {
        field_key: 'specifications',
        field_label: 'Technical Specifications List',
        field_group: 'SPECS',
        value: [
          {
            group_id: 'grp-1',
            group_name: 'General Specs',
            attribute_id: 'attr-1',
            attribute_name: 'Chassis Color',
            values: [{ id: 'val-1-1', label: 'Off Black' }]
          },
          {
            group_id: 'grp-2',
            group_name: 'Performance & Hardware',
            attribute_id: 'attr-3',
            attribute_name: 'RAM Capacity',
            values: [{ id: 'val-3-1', label: '32GB DDR5' }]
          }
        ],
        status: 'PENDING'
      },
      variants: {
        field_key: 'variants',
        field_label: 'Sellable Product Variants',
        field_group: 'VARIANTS',
        value: [
          {
            id: 'sprod-2-v1',
            variant_platform_id: 'gpid-10103',
            sku: 'G634JYR-XS96-32G',
            price: 2899.99,
            currency: 'USD',
            stock: 20,
            min_order_quantity: 1,
            combination_values: [
              { group_id: 'grp-1', group_name: 'General Specs', attribute_id: 'attr-1', attribute_name: 'Chassis Color', value_id: 'val-1-1', label: 'Off Black' },
              { group_id: 'grp-2', group_name: 'Performance & Hardware', attribute_id: 'attr-3', attribute_name: 'RAM Capacity', value_id: 'val-3-1', label: '32GB DDR5' }
            ]
          }
        ],
        status: 'PENDING'
      }
    },
    audit_history: [
      {
        id: 'aud-20',
        round: 1,
        actor_id: 'usr-4',
        actor_name: 'ASUS Admin',
        action: 'SUBMITTED',
        notes: 'Submitted ROG Strix SCAR 16 Gaming Laptop.',
        timestamp: '2026-07-30T09:00:00Z'
      }
    ]
  }
];
