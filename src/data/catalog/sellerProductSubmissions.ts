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
      year_of_manufacture: {
        field_key: 'year_of_manufacture',
        field_label: 'Year of Manufacture',
        field_group: 'MANUFACTURING',
        value: 2024,
        status: 'PENDING'
      },
      model_number: {
        field_key: 'model_number',
        field_label: 'Model Number',
        field_group: 'MANUFACTURING',
        value: 'SM-S928B/DS',
        status: 'PENDING'
      },
      part_number: {
        field_key: 'part_number',
        field_label: 'Part Number',
        field_group: 'MANUFACTURING',
        value: 'GH90-15822A',
        status: 'PENDING'
      },
      height: {
        field_key: 'height',
        field_label: 'Height',
        field_group: 'DIMENSIONS',
        value: '162.3 mm',
        status: 'PENDING'
      },
      width: {
        field_key: 'width',
        field_label: 'Width',
        field_group: 'DIMENSIONS',
        value: '79.0 mm',
        status: 'PENDING'
      },
      length: {
        field_key: 'length',
        field_label: 'Length',
        field_group: 'DIMENSIONS',
        value: '8.6 mm',
        status: 'PENDING'
      },
      weight: {
        field_key: 'weight',
        field_label: 'Weight',
        field_group: 'DIMENSIONS',
        value: '232 g',
        status: 'PENDING'
      },
      deviations: {
        field_key: 'deviations',
        field_label: 'Deviations',
        field_group: 'OPERATIONAL',
        value: 'Includes pre-installed Samsung Knox E-FOTA corporate provisioning license.',
        status: 'PENDING'
      },
      exclusions: {
        field_key: 'exclusions',
        field_label: 'Exclusions',
        field_group: 'OPERATIONAL',
        value: 'Power adapter not included in eco retail box.',
        status: 'PENDING'
      },
      assumptions: {
        field_key: 'assumptions',
        field_label: 'Assumptions',
        field_group: 'OPERATIONAL',
        value: 'Compatible with standard USB Power Delivery 3.0 chargers.',
        status: 'PENDING'
      },
      operation_instructions: {
        field_key: 'operation_instructions',
        field_label: 'Operation Instructions',
        field_group: 'OPERATIONAL',
        value: 'Use S-Pen slot for integrated stylus operation.',
        status: 'PENDING'
      },
      safety_instructions: {
        field_key: 'safety_instructions',
        field_label: 'Safety Instructions',
        field_group: 'OPERATIONAL',
        value: 'IP68 water resistance rating applies up to 1.5m fresh water for 30 minutes.',
        status: 'PENDING'
      },
      handling_instructions: {
        field_key: 'handling_instructions',
        field_label: 'Handling Instructions',
        field_group: 'OPERATIONAL',
        value: 'Store in moisture-controlled warehouse environment.',
        status: 'PENDING'
      },
      maintenance_instructions: {
        field_key: 'maintenance_instructions',
        field_label: 'Maintenance Instructions',
        field_group: 'OPERATIONAL',
        value: 'Keep USB-C port dry and clean before charging.',
        status: 'PENDING'
      },
      additional_requirements: {
        field_key: 'additional_requirements',
        field_label: 'Additional Requirements',
        field_group: 'OPERATIONAL',
        value: 'Requires Knox Mobile Enrollment registration upon first boot.',
        status: 'PENDING'
      },
      additional_information: {
        field_key: 'additional_information',
        field_label: 'Additional Information',
        field_group: 'OPERATIONAL',
        value: 'Includes 3-year Knox Suite Enterprise warranty.',
        status: 'PENDING'
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
      year_of_manufacture: {
        field_key: 'year_of_manufacture',
        field_label: 'Year of Manufacture',
        field_group: 'MANUFACTURING',
        value: 2024,
        status: 'APPROVED'
      },
      model_number: {
        field_key: 'model_number',
        field_label: 'Model Number',
        field_group: 'MANUFACTURING',
        value: 'SM-S928B-1TB',
        status: 'APPROVED'
      },
      part_number: {
        field_key: 'part_number',
        field_label: 'Part Number',
        field_group: 'MANUFACTURING',
        value: 'GH90-15822B',
        status: 'APPROVED'
      },
      height: {
        field_key: 'height',
        field_label: 'Height',
        field_group: 'DIMENSIONS',
        value: '162.3 mm',
        status: 'APPROVED'
      },
      width: {
        field_key: 'width',
        field_label: 'Width',
        field_group: 'DIMENSIONS',
        value: '79.0 mm',
        status: 'APPROVED'
      },
      length: {
        field_key: 'length',
        field_label: 'Length',
        field_group: 'DIMENSIONS',
        value: '8.6 mm',
        status: 'APPROVED'
      },
      weight: {
        field_key: 'weight',
        field_label: 'Weight',
        field_group: 'DIMENSIONS',
        value: '232',
        status: 'REJECTED',
        rejection_comment: 'Please specify explicit unit metric (e.g. "232 g").',
        reviewed_by_user_name: 'Super Admin',
        reviewed_at: '2026-07-29T14:00:00Z',
        round_history: [
          { round: 1, value: '232', status: 'REJECTED', rejection_comment: 'Please specify explicit unit metric (e.g. "232 g").', reviewed_by_user_name: 'Super Admin', timestamp: '2026-07-29T14:00:00Z' }
        ]
      },
      safety_instructions: {
        field_key: 'safety_instructions',
        field_label: 'Safety Instructions',
        field_group: 'OPERATIONAL',
        value: 'None',
        status: 'REJECTED',
        rejection_comment: 'Please provide standard battery and water resistance safety instructions.',
        reviewed_by_user_name: 'Super Admin',
        reviewed_at: '2026-07-29T14:00:00Z',
        round_history: [
          { round: 1, value: 'None', status: 'REJECTED', rejection_comment: 'Please provide standard battery and water resistance safety instructions.', reviewed_by_user_name: 'Super Admin', timestamp: '2026-07-29T14:00:00Z' }
        ]
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
      year_of_manufacture: {
        field_key: 'year_of_manufacture',
        field_label: 'Year of Manufacture',
        field_group: 'MANUFACTURING',
        value: 2024,
        status: 'PENDING'
      },
      model_number: {
        field_key: 'model_number',
        field_label: 'Model Number',
        field_group: 'MANUFACTURING',
        value: 'G634JYR-XS96',
        status: 'PENDING'
      },
      part_number: {
        field_key: 'part_number',
        field_label: 'Part Number',
        field_group: 'MANUFACTURING',
        value: 'PN-ASUS-991',
        status: 'PENDING'
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
