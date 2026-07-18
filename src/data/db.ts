import Dexie, { type Table } from 'dexie';
import { type Workspace } from '../contexts/WorkspaceContext';

export interface Category {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  parentId: string | null;
  mappedGroupIds: string[];
  childrenCount?: number;
}

export interface AttributeGroup {
  id: string;
  name: string;
  attributeIds: string[]; // Many-to-many or one-to-many relation to Attributes
}

export interface Attribute {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  valueIds: string[]; // Options for select type
}

export interface AttributeValue {
  id: string;
  value: string;
}

export interface PlatformProduct {
  id: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  description?: string;
  isActive?: boolean;
  brand?: string;
  manufacturer?: string;
  modelNumber?: string;
  partNumber?: string;
  globalSpecs: Record<string, any>;
}

export interface UserProduct {
  id: string;
  tenantId: string;
  tenantName?: string;
  platformProductId: string | null;
  status: string;
  name: string;
  categoryName: string;
  partNumber: string;
  reviewData: Record<string, any>;
  variants: any[];
  globalSpecs: any[];
  updatedAt: string;
  submittedAt: string;
  payload?: any;
}

export interface RFQItem {
  id: string;
  categoryId?: string;
  platformProductId?: string;
  targetTenantId?: string;
  quantity: number;
  unit?: string;
  brand?: string;
  manufacturer?: string;
  countryOfOrigin?: string;
  modelNumber?: string;
  partNumber?: string;
  height?: string;
  width?: string;
  weight?: string;
  dynamicAttributes?: Record<string, string>;
}

export interface RFQQuoteItem {
  rfqItemId: string;
  price: number;
  leadTimeDays: number;
}

export interface RFQQuote {
  id: string;
  responderTenantId: string;
  responderTenantName: string;
  items: RFQQuoteItem[];
  notes: string;
  status: string;
  submittedAt: string;
}

export interface RFQ {
  id: string;
  rfqNumber: string;
  title: string;
  status: string;
  requesterTenantId: string;
  requesterTenantName: string;
  contactEmail: string;
  contactMobile: string;
  submissionDeadline: string;
  shippingDestination: string;
  currency: string;
  specifications: string;
  createdAt: string;
  items: RFQItem[];
  quotes: RFQQuote[];
}

export class DelexyDatabase extends Dexie {
  workspaces!: Table<Workspace, string>;
  categories!: Table<Category, string>;
  attributeGroups!: Table<AttributeGroup, string>;
  attributes!: Table<Attribute, string>;
  attributeValues!: Table<AttributeValue, string>;
  platformProducts!: Table<PlatformProduct, string>;
  userProducts!: Table<UserProduct, string>;
  rfqs!: Table<RFQ, string>;

  constructor() {
    super('DelexyDB_v3');
    this.version(1).stores({
      workspaces: 'id, type',
      categories: 'id, parentId, slug',
      attributeGroups: 'id',
      attributes: 'id',
      attributeValues: 'id',
      platformProducts: 'id, categoryId, brand',
      userProducts: 'id, tenantId, platformProductId, status',
      rfqs: 'id, requesterTenantId, status'
    });
  }
}

export const db = new DelexyDatabase();
