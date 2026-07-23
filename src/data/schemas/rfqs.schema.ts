export interface RFQItem {
  id: string;
  rfqId?: string;
  userProductId?: string;
  platformProductId?: string;
  categoryId?: string;
  customProductName?: string;
  quantity: number;
  unit: string;
  targetPrice?: number;
  targetTenantId?: string;
  brand?: string;
  manufacturer?: string;
  seller?: string;
  countryOfOrigin?: string;
  modelNumber?: string;
  partNumber?: string;
  height?: number;
  width?: number;
  weight?: number;
  dynamicAttributes?: Record<string, any>;
  specifications?: Record<string, any>;
  [key: string]: any;
}

export interface RFQQuoteItem {
  itemId?: string;
  rfqItemId?: string;
  unitPrice?: number;
  price?: number;
  totalPrice?: number;
  leadTimeDays?: number;
  notes?: string;
  [key: string]: any;
}

export interface RFQQuote {
  id: string;
  rfqId?: string;
  supplierBusinessId?: string;
  responderTenantId?: string;
  responderTenantName?: string;
  status: any;
  totalAmount?: number;
  validUntil?: string;
  submittedAt?: string;
  notes?: string;
  items: RFQQuoteItem[];
  chatLog?: any[];
  createdAt?: string;
  [key: string]: any;
}

export interface RFQ {
  id: string;
  rfqNumber?: string;
  buyerUserId?: string;
  buyerBusinessId?: string;
  requesterTenantId?: string;
  requesterTenantName?: string;
  title: string;
  status: any;
  contactEmail?: string;
  contactMobile?: string;
  currency?: string;
  submissionDeadline?: string;
  shippingDestination?: string;
  specifications?: any;
  categoryIds?: string[];
  items: RFQItem[];
  quotes?: RFQQuote[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface UserProduct {
  id: string;
  userId?: string;
  tenantId?: string;
  tenantName?: string;
  businessId?: string;
  name: string;
  categoryId: string;
  categoryName?: string;
  platformProductId?: string;
  brand?: string;
  manufacturer?: string;
  modelNumber?: string;
  partNumber?: string;
  countryOfOrigin?: string;
  yearOfManufacture?: number;
  height?: number;
  width?: number;
  emptyWeight?: number;
  globalSpecs?: Record<string, any>;
  dynamicAttributes?: Record<string, any>;
  status: string;
  createdAt?: string;
  [key: string]: any;
}

export interface CategoryProduct {
  id: string;
  name: string;
  categoryId: string;
  status: string;
  [key: string]: any;
}
