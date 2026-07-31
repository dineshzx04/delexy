import type { SellerProduct } from './catalog.module';

export const mockSellerProducts: SellerProduct[] = [
  // Seller Product 1: Samsung India (pty-1) selling Samsung Galaxy S24 Ultra Enterprise Edition
  {
    id: 'sprod-1',
    category_id: 'c-3-1-1',
    catalog_product_id: 'prod-2',
    product_name: 'Samsung Galaxy S24 Ultra Enterprise Edition',
    manufacturer_id: 'mfg-1', // Samsung India Electronics (pty-1)
    brand_id: 'brd-1',        // Samsung (brd-1)
    party_id: 'pty-1',       // Samsung India Business Party (pty-1)

    year_of_manufacture: 2024,
    country_of_origin: 'KR',
    model_number: 'SM-S928B/DS',
    part_number: 'GH90-15822A',

    height: '162.3 mm',
    width: '79.0 mm',
    length: '8.6 mm',
    weight: '232 g',

    deviations: 'Includes pre-installed Samsung Knox E-FOTA corporate provisioning license.',
    exclusions: 'Power adapter not included in eco retail box.',
    assumptions: 'Compatible with standard USB Power Delivery 3.0 chargers.',
    operation_instructions: 'Use S-Pen slot for integrated stylus operation.',
    safety_instructions: 'IP68 water resistance rating applies up to 1.5m fresh water for 30 minutes.',
    handling_instructions: 'Store in moisture-controlled warehouse environment.',
    maintenance_instructions: 'Keep USB-C port dry and clean before charging.',
    additional_requirements: 'Requires Knox Mobile Enrollment registration upon first boot.',
    additional_information: 'Includes 3-year Knox Suite Enterprise warranty.',

    dynamic_attributes: [
      {
        group_id: 'grp-4',
        attribute_id: 'attr-7',
        selected_value_ids: ['val-7-1', 'val-7-2'],
        is_variant: true
      },
      {
        group_id: 'grp-5',
        attribute_id: 'attr-9',
        selected_value_ids: ['val-9-1', 'val-9-2'],
        is_variant: true
      },
      {
        group_id: 'grp-4',
        attribute_id: 'attr-8',
        selected_value_ids: ['val-8-1'],
        is_variant: false
      },
      {
        group_id: 'grp-5',
        attribute_id: 'attr-10',
        selected_value_ids: ['val-10-1'],
        is_variant: false
      }
    ],

    specifications: [
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

    variants: [
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
      },
      {
        id: 'sprod-1-v2',
        variant_platform_id: 'gpid-10102',
        sku: 'SM-S928B-BLK-1TB',
        price: 1499.99,
        currency: 'USD',
        stock: 15,
        min_order_quantity: 1,
        combination_values: [
          { group_id: 'grp-4', group_name: 'Build & Aesthetics', attribute_id: 'attr-7', attribute_name: 'Exterior Finish', value_id: 'val-7-1', label: 'Titanium Black' },
          { group_id: 'grp-5', group_name: 'Processing & Memory', attribute_id: 'attr-9', attribute_name: 'Storage Capacity', value_id: 'val-9-2', label: '1TB' }
        ]
      },
      {
        id: 'sprod-1-v3',
        variant_platform_id: 'gpid-10103',
        sku: 'SM-S928B-GRY-512',
        price: 1299.99,
        currency: 'USD',
        stock: 20,
        min_order_quantity: 1,
        combination_values: [
          { group_id: 'grp-4', group_name: 'Build & Aesthetics', attribute_id: 'attr-7', attribute_name: 'Exterior Finish', value_id: 'val-7-2', label: 'Titanium Gray' },
          { group_id: 'grp-5', group_name: 'Processing & Memory', attribute_id: 'attr-9', attribute_name: 'Storage Capacity', value_id: 'val-9-1', label: '512GB' }
        ]
      }
    ],

    is_locked: true,
    status: 'ACTIVE',
    created_at: '2026-01-15T08:00:00.000Z',
    updated_at: '2026-01-15T08:00:00.000Z'
  },

  // Seller Product 2: Individual User John Doe (pty-6) selling ASUS ROG Strix SCAR 16 (2024 Edition)
  {
    id: 'sprod-2',
    category_id: 'c-2-1-1',
    catalog_product_id: 'prod-1',
    product_name: 'ASUS ROG Strix SCAR 16 (2024 Edition)',
    manufacturer_id: 'mfg-4', // ASUSTeK Computer Inc Manufacturing (pty-5)
    brand_id: 'brd-2',        // ASUS (brd-2)
    party_id: 'pty-6',       // John Doe Individual User Seller Party (pty-6)

    year_of_manufacture: 2024,
    country_of_origin: 'TW',
    model_number: 'G634JZ-XS96',
    part_number: '90NR0CC1-M001B0',

    height: '22.6 mm',
    width: '354 mm',
    length: '264 mm',
    weight: '2.65 kg',

    deviations: 'Custom liquid metal cooling thermal paste factory applied.',
    exclusions: 'Backpack excluded.',
    assumptions: 'Power outlet requires 330W AC adapter compatibility.',
    operation_instructions: 'Use Armoury Crate shortcut key for Turbo thermal profile.',
    safety_instructions: 'Keep exhaust vents unobstructed during heavy load gaming.',
    handling_instructions: 'Store horizontally in padded protective sleeve.',
    maintenance_instructions: 'Clean intake vents with canned compressed air quarterly.',
    additional_requirements: 'None.',
    additional_information: 'Includes 1-year ASUS ROG International Warranty.',

    dynamic_attributes: [
      {
        group_id: 'grp-1',
        attribute_id: 'attr-1',
        selected_value_ids: ['val-1-1'],
        is_variant: false
      },
      {
        group_id: 'grp-1',
        attribute_id: 'attr-2',
        selected_value_ids: ['val-2-1'],
        is_variant: false
      },
      {
        group_id: 'grp-2',
        attribute_id: 'attr-3',
        selected_value_ids: ['val-3-1', 'val-3-2'],
        is_variant: true
      },
      {
        group_id: 'grp-2',
        attribute_id: 'attr-4',
        selected_value_ids: ['val-4-1', 'val-4-2'],
        is_variant: true
      }
    ],

    specifications: [
      {
        group_id: 'grp-1',
        group_name: 'General Specs',
        attribute_id: 'attr-1',
        attribute_name: 'Chassis Color',
        values: [{ id: 'val-1-1', label: 'Off Black' }]
      },
      {
        group_id: 'grp-1',
        group_name: 'General Specs',
        attribute_id: 'attr-2',
        attribute_name: 'Operating System',
        values: [{ id: 'val-2-1', label: 'Windows 11 Pro' }]
      }
    ],

    variants: [
      {
        id: 'sprod-2-v1',
        variant_platform_id: 'gpid-20201',
        sku: 'G634JZ-32G-4080',
        price: 2499.99,
        currency: 'USD',
        stock: 15,
        min_order_quantity: 1,
        combination_values: [
          { group_id: 'grp-2', group_name: 'Performance & Hardware', attribute_id: 'attr-3', attribute_name: 'RAM Capacity', value_id: 'val-3-1', label: '32GB DDR5' },
          { group_id: 'grp-2', group_name: 'Performance & Hardware', attribute_id: 'attr-4', attribute_name: 'Graphics Card', value_id: 'val-4-1', label: 'NVIDIA RTX 4080' }
        ]
      },
      {
        id: 'sprod-2-v2',
        variant_platform_id: 'gpid-20202',
        sku: 'G634JZ-64G-4090',
        price: 3299.99,
        currency: 'USD',
        stock: 10,
        min_order_quantity: 1,
        combination_values: [
          { group_id: 'grp-2', group_name: 'Performance & Hardware', attribute_id: 'attr-3', attribute_name: 'RAM Capacity', value_id: 'val-3-2', label: '64GB DDR5' },
          { group_id: 'grp-2', group_name: 'Performance & Hardware', attribute_id: 'attr-4', attribute_name: 'Graphics Card', value_id: 'val-4-2', label: 'NVIDIA RTX 4090' }
        ]
      }
    ],

    is_locked: true,
    status: 'ACTIVE',
    created_at: '2026-01-15T08:00:00.000Z',
    updated_at: '2026-01-15T08:00:00.000Z'
  },

  // Seller Product 3: Individual User John Doe (pty-6) selling ASICS Gel-Nimbus 26 Running Shoes under unclaimed placeholder ASICS brand & manufacturer (pty-3)
  {
    id: 'sprod-3',
    category_id: 'c-4-1-1-1',
    catalog_product_id: 'prod-3',
    product_name: 'ASICS Gel-Nimbus 26 Professional Running Shoes',
    manufacturer_id: 'mfg-3', // ASICS Global Placeholder (pty-3)
    brand_id: 'brd-4',        // ASICS (brd-4)
    party_id: 'pty-6',       // John Doe Individual User Seller Party (pty-6)

    year_of_manufacture: 2024,
    country_of_origin: 'JP',
    model_number: '1011B798-001',
    part_number: 'AS-G26-PRO',

    weight: '305 g',

    deviations: 'Standard retail packaging with extra shoelaces.',
    exclusions: 'Orthotic custom insoles not included.',
    operation_instructions: 'Suitable for long-distance road running.',
    safety_instructions: 'Ensure proper lace tension before marathon running.',
    handling_instructions: 'Air dry away from direct heat sources after wet runs.',
    maintenance_instructions: 'Wipe clean with mild soap damp cloth.',

    dynamic_attributes: [
      {
        group_id: 'grp-7',
        attribute_id: 'attr-13',
        selected_value_ids: ['val-13-1', 'val-13-2'],
        is_variant: true
      },
      {
        group_id: 'grp-7',
        attribute_id: 'attr-14',
        selected_value_ids: ['val-14-1'],
        is_variant: false
      },
      {
        group_id: 'grp-9',
        attribute_id: 'attr-18',
        selected_value_ids: ['val-18-1'],
        is_variant: false
      }
    ],

    specifications: [
      {
        group_id: 'grp-7',
        group_name: 'Sizing & Fit',
        attribute_id: 'attr-14',
        attribute_name: 'Shoe Width',
        values: [{ id: 'val-14-1', label: 'Standard (D)' }]
      },
      {
        group_id: 'grp-9',
        group_name: 'Performance Support',
        attribute_id: 'attr-18',
        attribute_name: 'Cushion Level',
        values: [{ id: 'val-18-1', label: 'Max Cushioning (FF BLAST+)' }]
      }
    ],

    variants: [
      {
        id: 'sprod-3-v1',
        variant_platform_id: 'gpid-30301',
        sku: '1011B798-001-U10',
        price: 159.99,
        currency: 'USD',
        stock: 50,
        min_order_quantity: 1,
        combination_values: [
          { group_id: 'grp-7', group_name: 'Sizing & Fit', attribute_id: 'attr-13', attribute_name: 'US Shoe Size', value_id: 'val-13-1', label: 'US 10' }
        ]
      },
      {
        id: 'sprod-3-v2',
        variant_platform_id: 'gpid-30302',
        sku: '1011B798-001-U11',
        price: 159.99,
        currency: 'USD',
        stock: 50,
        min_order_quantity: 1,
        combination_values: [
          { group_id: 'grp-7', group_name: 'Sizing & Fit', attribute_id: 'attr-13', attribute_name: 'US Shoe Size', value_id: 'val-13-2', label: 'US 11' }
        ]
      }
    ],

    is_locked: true,
    status: 'ACTIVE',
    created_at: '2026-05-10T08:00:00.000Z',
    updated_at: '2026-05-10T08:00:00.000Z'
  },

  // Seller Product 4: Sony Corporation (pty-4) selling Sony Alpha 7 IV Hybrid Camera
  {
    id: 'sprod-4',
    category_id: 'c-5-1-1',
    catalog_product_id: 'prod-4',
    product_name: 'Sony Alpha 7 IV Full-Frame Hybrid Camera Body',
    manufacturer_id: 'mfg-2', // Sony Corporation Manufacturing (pty-4)
    brand_id: 'brd-3',        // Sony (brd-3)
    party_id: 'pty-4',       // Sony Corporation Business Party (pty-4)

    year_of_manufacture: 2024,
    country_of_origin: 'JP',
    model_number: 'ILCE-7M4/B',
    part_number: 'SY-A7M4-BODY',

    height: '96.4 mm',
    width: '131.3 mm',
    length: '79.8 mm',
    weight: '658 g',

    deviations: 'Official UK retail distribution stock with multi-language manual.',
    exclusions: 'Lens sold separately.',
    operation_instructions: 'Refer to Sony Alpha e-Mount manual for custom button mapping.',
    safety_instructions: 'Keep body cap attached when no lens is mounted to protect sensor.',
    handling_instructions: 'Store with silica gel moisture pack in camera bag.',
    maintenance_instructions: 'Use blower bulb to clean dust from sensor glass.',

    dynamic_attributes: [
      {
        group_id: 'grp-10',
        attribute_id: 'attr-19',
        selected_value_ids: ['val-19-1'],
        is_variant: false
      },
      {
        group_id: 'grp-11',
        attribute_id: 'attr-21',
        selected_value_ids: ['val-21-1'],
        is_variant: false
      },
      {
        group_id: 'grp-12',
        attribute_id: 'attr-23',
        selected_value_ids: ['val-23-1'],
        is_variant: false
      }
    ],

    specifications: [
      {
        group_id: 'grp-10',
        group_name: 'Body & Grip',
        attribute_id: 'attr-19',
        attribute_name: 'Body Edition',
        values: [{ id: 'val-19-1', label: 'Matte Black Edition' }]
      },
      {
        group_id: 'grp-11',
        group_name: 'Sensor & Exposure',
        attribute_id: 'attr-21',
        attribute_name: 'Sensor Megapixels',
        values: [{ id: 'val-21-1', label: '33.0 MP Full-Frame Exmor R' }]
      },
      {
        group_id: 'grp-12',
        group_name: 'Capture Capability',
        attribute_id: 'attr-23',
        attribute_name: 'Max Video Resolution',
        values: [{ id: 'val-23-1', label: '4K 60p 10-bit 4:2:2' }]
      }
    ],

    variants: [
      {
        id: 'sprod-4-v1',
        variant_platform_id: 'gpid-40401',
        sku: 'ILCE-7M4-BODY-UK',
        price: 2498.00,
        currency: 'USD',
        stock: 15,
        min_order_quantity: 1,
        combination_values: [
          { group_id: 'grp-10', group_name: 'Body & Grip', attribute_id: 'attr-19', attribute_name: 'Body Edition', value_id: 'val-19-1', label: 'Matte Black Edition' }
        ]
      }
    ],

    is_locked: true,
    status: 'ACTIVE',
    created_at: '2026-01-15T08:00:00.000Z',
    updated_at: '2026-01-15T08:00:00.000Z'
  }
];
