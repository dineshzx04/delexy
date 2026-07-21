import Dexie, { type Table } from 'dexie';
import { type Workspace } from '../contexts/WorkspaceContext';

// 1. USERS
export interface User {
  id: string;
  email: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// 2. PARTIES
export type PartyType = 'USER' | 'BUSINESS';
export interface Party {
  id: string;
  type: PartyType;
  userId?: string | null;
  businessId?: string | null;
  createdAt: string;
  updatedAt: string;
}

// 3. PARTY ROLES
export type PartyRoleType = 'SELLER' | 'MANUFACTURER' | 'BRAND_OWNER' | 'DISTRIBUTOR' | 'BUYER';
export interface PartyRole {
  id: string;
  partyId: string;
  role: PartyRoleType;
  createdAt: string;
}

// 4. BUSINESSES
export interface Business {
  id: string;
  name: string;
  legalName?: string;
  website?: string;
  phone?: string;
  countryCode: string;
  status: string;
  isClaimed: boolean;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

// 5. BUSINESS IDENTIFIERS
export type BusinessIdentifierType = 'GST' | 'VAT' | 'EIN' | 'TIN' | 'UEN' | 'DUNS' | 'OTHER';
export interface BusinessIdentifier {
  id: string;
  businessId: string;
  type: BusinessIdentifierType;
  value: string;
  countryCode: string;
  isPrimary: boolean;
  verified: boolean;
  createdAt: string;
}

// 6. BUSINESS MEMBERS
export type BusinessMemberRole = 'OWNER' | 'ADMIN' | 'EMPLOYEE' | 'MANAGER';
export interface BusinessMember {
  id: string;
  businessId: string;
  userId: string;
  memberRole: BusinessMemberRole;
  status: string;
  joinedAt: string;
}

// 7. ADDRESSES
export interface Address {
  id: string;
  line1: string;
  line2?: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  countryCode: string;
  latitude?: number;
  longitude?: number;
}

export type BusinessAddressType = 'HEAD_OFFICE' | 'BILLING' | 'SHIPPING' | 'FACTORY';
export interface BusinessAddress {
  id: string;
  businessId: string;
  addressId: string;
  type: BusinessAddressType;
}

// 8. BRANDS
export type BrandStatus = 'UNCLAIMED' | 'CLAIMED';
export interface Brand {
  id: string;
  name: string;
  description?: string;
  ownerPartyId?: string | null;
  createdByPartyId?: string | null;
  status: BrandStatus;
  createdAt: string;
  updatedAt: string;
}

// 9. MANUFACTURERS
export type ManufacturerStatus = 'UNCLAIMED' | 'CLAIMED';
export interface Manufacturer {
  id: string;
  name: string;
  description?: string;
  ownerPartyId?: string | null;
  createdByPartyId?: string | null;
  status: ManufacturerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  parentId: string | null;
  mappedGroupIds: string[];
  childrenCount?: number;
}

export type FieldReviewStatus = 'pending' | 'approved' | 'rejected';
export interface FieldReview {
  status: FieldReviewStatus;
  comment?: string;
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

export interface CategoryProduct {
  id: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface UserProductDynamicAttributeValue {
  id: string;
  label: string;
}

export interface UserProductDynamicAttribute {
  attributeId: string;
  attributeName: string;
  attributeGroupId: string;
  attributeGroupName: string;
  isVariant: boolean;
  values: UserProductDynamicAttributeValue[];
}

export interface UserProductVariantValue {
  attributeId: string;
  attributeName: string;
  valueId: string;
  label: string;
}

export interface UserProductVariant {
  id: string;
  name: string;
  displayName: string;
  platformVariantId?: string;
  amount: number;
  currency: string;
  stock: number;
  reserved: number;
  available: number;
  minOrderQuantity: number;
  leadTimeInDays: number;
  values: UserProductVariantValue[];
}

export interface UserProductGlobalSpec {
  attributeId: string;
  attributeName: string;
  values: UserProductDynamicAttributeValue[];
}

export interface UserProduct {
  id: string;
  tenantId: string;
  tenantName?: string;
  productId: string | null;
  categoryId?: string;
  categoryName: string;
  status: string;

  // Production Details
  name: string;
  modelNumber?: string;
  partNumber: string;
  yearOfManufacture?: number;
  countryOfOrigin?: { code: string; name: string };
  manufacturerId?: string;
  brandId?: string;

  // Dimensions & Weight
  height?: string;
  width?: string;
  length?: string;
  emptyWeight?: string;

  // Seller Details
  sellerPartyId?: string;

  // Others (Instructions & Documentation)
  deviations?: string;
  exclusions?: string;
  assumptions?: string;
  operationInstructions?: string;
  safetyInstructions?: string;
  handlingInstructions?: string;
  maintenanceInstructions?: string;
  additionalRequirements?: string;
  additionalInformation?: string;

  // Dynamic Attributes
  dynamicAttributes?: UserProductDynamicAttribute[];
  globalSpecs: UserProductGlobalSpec[];
  variants: UserProductVariant[];

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
  submittedAt?: string;
}

export interface UserProductReview extends UserProduct {
  reviewData: Record<string, any>;
}

export interface RFQItem {
  id: string;
  categoryId?: string;
  categoryProductId?: string;
  targetTenantId?: string;
  quantity: number;
  unit?: string;
  brand?: string[];
  manufacturer?: string[];
  seller?: string[];
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
  responseType?: 'EXISTING_PRODUCT' | 'RFQ_PRODUCT' | 'OPEN_RFQ';
  sellerProductId?: string | null;
  sellerVariantId?: string | null;
  rfqProductId?: string | null;
  quotedSpecifications?: {
    brand?: string[];
    manufacturer?: string[];
    dynamicAttributes?: Record<string, string>;
  };
}

export interface RFQChat {
  id: string;
  quoteId: string;
  itemId: string;
  senderTenantId: string;
  message: string;
  timestamp: string;
  fieldContext?: string;
}

export interface RFQQuote {
  id: string;
  responderTenantId: string;
  responderTenantName: string;
  items: RFQQuoteItem[];
  notes: string;
  status: string;
  submittedAt: string;
  chatLog?: RFQChat[];
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

  // Master Identity Data
  users!: Table<User, string>;
  parties!: Table<Party, string>;
  partyRoles!: Table<PartyRole, string>;
  businesses!: Table<Business, string>;
  businessIdentifiers!: Table<BusinessIdentifier, string>;
  businessMembers!: Table<BusinessMember, string>;
  addresses!: Table<Address, string>;
  businessAddresses!: Table<BusinessAddress, string>;

  // Master Catalog Data
  brands!: Table<Brand, string>;
  manufacturers!: Table<Manufacturer, string>;

  attributeValues!: Table<AttributeValue, string>;
  attributes!: Table<Attribute, string>;
  attributeGroups!: Table<AttributeGroup, string>;
  categories!: Table<Category, string>;
  categoryProducts!: Table<CategoryProduct, string>;
  userProducts!: Table<UserProduct, string>;
  userProductReviews!: Table<UserProductReview, string>;
  rfqs!: Table<RFQ, string>;

  constructor() {
    super('DelexyDB');
    this.version(3).stores({
      workspaces: 'id',

      users: 'id',
      parties: 'id',
      partyRoles: 'id',
      businesses: 'id',
      businessIdentifiers: 'id',
      businessMembers: 'id',
      addresses: 'id',
      businessAddresses: 'id',

      brands: 'id',
      manufacturers: 'id',

      attributeValues: 'id',
      attributes: 'id',
      attributeGroups: 'id',
      categories: 'id',
      categoryProducts: 'id',
      userProducts: 'id',
      userProductReviews: 'id',
      rfqs: 'id'
    });
  }
}

export const db = new DelexyDatabase();
