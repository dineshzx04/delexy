export type ProductStatus = 'Draft' | 'Submitted' | 'Under Review' | 'Changes Requested' | 'Resubmitted' | 'Approved' | 'Published';

export type FieldReviewStatus = 'pending' | 'approved' | 'rejected';
export interface FieldReview {
  status: FieldReviewStatus;
  comment?: string;
}

export interface Product {
  id: string;
  tenantId: string;
  tenantName: string;
  
  // Core Info
  name: string;
  categoryName: string;
  partNumber: string;
  status: ProductStatus;
  
  // Timestamps
  updatedAt: string;
  submittedAt?: string;

  // The actual product data (Built by ProductBuilder)
  payload: {
    productData: Record<string, any>;
    globalSpecs: { name: string; value: string }[];
    variants: { id: string; name: string; sku: string; price: number; stock: number; minOrder: number }[];
  };

  // The review data (Added by PlatformReviewDetail)
  reviewData: Record<string, FieldReview>; 
}

// In-memory store
let mockProducts: Product[] = [
  {
    id: 'prod-1',
    tenantId: 'tenant-1',
    tenantName: 'Acme Corp (Business)',
    name: 'Sample product A',
    partNumber: '2',
    categoryName: 'Floating Ball Valves',
    status: 'Submitted',
    updatedAt: '2023-10-26 14:30',
    submittedAt: '2023-10-26 14:30',
    reviewData: {},
    payload: {
      productData: {
        platformProductId: 'pp-3',
        height: '10', width: '20', emptyWeight: '50kg',
        name: 'Sample product A', modelNumber: '1', partNumber: '2',
        yearOfManufacture: 2023, countryOfOrigin: 'US', manufacturer: 'acme', brand: 'brand-x',
        seller: 'vendor-a', deviations: 'None', exclusions: 'None', assumptions: 'None'
      },
      globalSpecs: [
        { name: 'Material Grade', value: 'Standard ASTM A216 WCB' },
        { name: 'End Connection', value: 'Flanged RF' },
        { name: 'Operation', value: 'Lever Operated' },
        { name: 'Fire Safe', value: 'API 607 Certified' },
        { name: 'NACE', value: 'MR0175 Compliant' }
      ],
      variants: [
        { id: 'v1', name: '1/2" 150#', sku: 'PP-3-150-05', price: 100, stock: 50, minOrder: 1 },
        { id: 'v2', name: '3/4" 150#', sku: 'PP-3-150-075', price: 110, stock: 45, minOrder: 1 },
        { id: 'v3', name: '1" 150#', sku: 'PP-3-150-10', price: 125, stock: 60, minOrder: 1 },
        { id: 'v4', name: '1.5" 150#', sku: 'PP-3-150-15', price: 160, stock: 25, minOrder: 1 },
        { id: 'v5', name: '2" 150#', sku: 'PP-3-150-20', price: 210, stock: 40, minOrder: 1 },
        { id: 'v6', name: '3" 150#', sku: 'PP-3-150-30', price: 340, stock: 15, minOrder: 1 },
        { id: 'v7', name: '4" 150#', sku: 'PP-3-150-40', price: 550, stock: 10, minOrder: 1 },
        { id: 'v8', name: '1/2" 300#', sku: 'PP-3-300-05', price: 130, stock: 30, minOrder: 1 },
        { id: 'v9', name: '3/4" 300#', sku: 'PP-3-300-075', price: 145, stock: 25, minOrder: 1 },
        { id: 'v10', name: '1" 300#', sku: 'PP-3-300-10', price: 170, stock: 20, minOrder: 1 },
        { id: 'v11', name: '1.5" 300#', sku: 'PP-3-300-15', price: 220, stock: 15, minOrder: 1 },
        { id: 'v12', name: '2" 300#', sku: 'PP-3-300-20', price: 290, stock: 10, minOrder: 1 },
        { id: 'v13', name: '3" 300#', sku: 'PP-3-300-30', price: 450, stock: 5, minOrder: 1 },
        { id: 'v14', name: '4" 300#', sku: 'PP-3-300-40', price: 720, stock: 2, minOrder: 1 }
      ]
    }
  },
  {
    id: 'prod-2',
    tenantId: 'tenant-1',
    tenantName: 'John Doe (Individual)',
    name: 'Micro Controller Pro',
    partNumber: 'MCP-R2',
    categoryName: 'Logic Boards',
    status: 'Under Review',
    updatedAt: '2023-10-25 09:15',
    submittedAt: '2023-10-25 09:15',
    reviewData: {
      'prod-name': { status: 'approved' },
      'prod-part': { status: 'rejected', comment: 'Part number format is invalid. It must be at least 10 characters long as per strict rules.' },
      'prod-model': { status: 'approved' },
      'spec-Clock Speed': { status: 'rejected', comment: 'Please verify this clock speed. Is it a typo?' },
      'spec-Architecture': { status: 'approved' },
      'spec-Operating Voltage': { status: 'rejected', comment: 'Is this compatible with 1.8V logic? Please clarify.' },
      'variant-v1': { status: 'approved' },
      'variant-v2': { status: 'approved' },
      'variant-v13': { status: 'rejected', comment: 'Price is abnormally high for this variant. Check your margins.' }
    },
    payload: {
      productData: {
        categoryId: 'c-2-2-1-1',
        platformProductId: 'pp-3',
        name: 'Micro Controller Pro', modelNumber: 'R2', partNumber: 'MCP-R2', manufacturer: 'globaltech', brand: 'premium',
        dynamicAttributes: {
          'attr-1': ['Standard'],
          'attr-2': ['AC 110V', 'DC 12V'],
          'attr-4': ['-40°C to 85°C']
        }
      },
      globalSpecs: [
        { name: 'Operating Temperature', value: '-40°C to 85°C' }
      ],
      variants: [
        { id: 'v1', name: '16MHz 256KB', sku: 'MC-R2-16-256', price: 4.5, stock: 1000, minOrder: 100 },
        { id: 'v2', name: '16MHz 512KB', sku: 'MC-R2-16-512', price: 5.0, stock: 850, minOrder: 100 },
        { id: 'v3', name: '32MHz 256KB', sku: 'MC-R2-32-256', price: 5.5, stock: 500, minOrder: 50 },
        { id: 'v4', name: '32MHz 512KB', sku: 'MC-R2-32-512', price: 6.0, stock: 400, minOrder: 50 },
        { id: 'v5', name: '32MHz 1MB', sku: 'MC-R2-32-1M', price: 7.5, stock: 300, minOrder: 50 },
        { id: 'v6', name: '48MHz 512KB', sku: 'MC-R2-48-512', price: 8.0, stock: 200, minOrder: 50 },
        { id: 'v7', name: '48MHz 1MB', sku: 'MC-R2-48-1M', price: 9.5, stock: 150, minOrder: 25 },
        { id: 'v8', name: '64MHz 1MB', sku: 'MC-R2-64-1M', price: 11.0, stock: 100, minOrder: 25 },
        { id: 'v9', name: '64MHz 2MB', sku: 'MC-R2-64-2M', price: 13.5, stock: 75, minOrder: 25 },
        { id: 'v10', name: '72MHz 1MB', sku: 'MC-R2-72-1M', price: 15.0, stock: 50, minOrder: 10 },
        { id: 'v11', name: '72MHz 2MB', sku: 'MC-R2-72-2M', price: 18.0, stock: 40, minOrder: 10 },
        { id: 'v12', name: '84MHz 2MB', sku: 'MC-R2-84-2M', price: 21.0, stock: 30, minOrder: 10 },
        { id: 'v13', name: '120MHz 2MB', sku: 'MC-R2-120-2M', price: 25.0, stock: 20, minOrder: 5 }
      ]
    }
  },
  {
    id: 'prod-3',
    tenantId: 'tenant-1',
    tenantName: 'Jane Smith (Individual)',
    name: 'Resubmitted Widget',
    partNumber: 'RW-1',
    categoryName: 'Widgets',
    status: 'Resubmitted',
    updatedAt: '2023-10-29 10:00',
    submittedAt: '2023-10-29 10:00',
    reviewData: {
      'spec-Core Material': { status: 'pending', comment: '[PREVIOUS REJECTION]: Must use Stainless Steel, not High Carbon Steel.' },
      'spec-Tolerance': { status: 'pending', comment: '[PREVIOUS REJECTION]: Tolerance must be at least +/- 0.05mm.' },
      'variant-v1': { status: 'approved' },
      'variant-v13': { status: 'pending', comment: '[PREVIOUS REJECTION]: XXL Black is not allowed in this category.' }
    },
    payload: {
      productData: { 
        name: 'Resubmitted Widget', 
        partNumber: 'RW-1',
        categoryId: 'c-2-2-1-1',
        platformProductId: 'pp-3',
        dynamicAttributes: {
          'attr-1': ['Premium', 'Industrial']
        }
      },
      globalSpecs: [],
      variants: [
        { id: 'v1', name: 'Standard Red', sku: 'WID-R', price: 10, stock: 100, minOrder: 10 },
        { id: 'v13', name: 'XXL Black', sku: 'WID-XXL-B', price: 25, stock: 10, minOrder: 5 }
      ]
    }
  },
  {
    id: 'prod-4',
    tenantId: 'tenant-1',
    tenantName: 'Acme Corp (Business)',
    name: 'Lithium Battery Pack',
    partNumber: 'LBP-10AH',
    categoryName: 'Power Systems',
    status: 'Draft',
    updatedAt: '2023-10-28 14:00',
    reviewData: {},
    payload: {
      productData: { name: 'Lithium Battery Pack', partNumber: 'LBP-10AH', capacity: '10Ah' },
      globalSpecs: [],
      variants: []
    }
  },
  {
    id: 'prod-5',
    tenantId: 'tenant-1',
    tenantName: 'Acme Corp (Business)',
    name: 'Heavy Duty Servo',
    partNumber: 'HDS-99',
    categoryName: 'Motors',
    status: 'Changes Requested',
    updatedAt: '2023-10-27 08:30',
    submittedAt: '2023-10-26 12:00',
    reviewData: {
      'prod-part': { status: 'rejected', comment: 'Needs standard prefix.' }
    },
    payload: {
      productData: { name: 'Heavy Duty Servo', partNumber: 'HDS-99' },
      globalSpecs: [],
      variants: []
    }
  }
];

export const getProducts = () => [...mockProducts];

export const getProductById = (id: string) => mockProducts.find(p => p.id === id);

export const createProduct = (product: Omit<Product, 'id'>) => {
  const newProduct = {
    ...product,
    id: `prod-${Date.now()}`
  };
  mockProducts = [newProduct, ...mockProducts];
  return newProduct;
};

export const updateProduct = (id: string, updates: Partial<Product>) => {
  mockProducts = mockProducts.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : p);
  return getProductById(id);
};

export const deleteProduct = (id: string) => {
  mockProducts = mockProducts.filter(p => p.id !== id);
};
