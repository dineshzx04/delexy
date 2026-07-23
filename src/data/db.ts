import Dexie, { type Table } from 'dexie';

// =================================================================
// 1. MASTER EMAILS
// =================================================================
export interface Email {
  id: string; // e.g. 'em-1'
  email: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

// =================================================================
// 2. CORE USERS & PLATFORM ROLES
// =================================================================
export interface User {
  id: string; // e.g. 'usr-1'
  app_user_id: string; // e.g. 'USR-001'
  first_name: string;
  last_name: string;
  full_name: string;
  date_of_birth: string;
  place_of_birth: string;
  country_of_residence: string;
  is_platform_active: boolean; // TRUE = Platform Admin Mode Active
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlatformPermission {
  id: string; // e.g. 'pperm-1'
  code: string; // e.g. 'platform.businesses.view'
  description?: string | null;
  created_at: string;
}

export interface PlatformRole {
  id: string; // e.g. 'prole-1'
  name: string; // e.g. 'Platform Super Admin'
  description?: string | null;
  is_system_default: boolean;
  created_at: string;
}

export interface PlatformRolePermission {
  id: string; // e.g. 'prp-1'
  role_id: string;
  permission_id: string;
}

export interface UserPlatformRole {
  id: string; // e.g. 'upr-1'
  user_id: string;
  role_id: string;
  granted_at: string;
}

// =================================================================
// 3. MULTI-ID / KYC IDENTIFICATIONS
// =================================================================
export interface UserIdentification {
  id: string; // e.g. 'uid-1'
  user_id: string;
  id_type: 'NATIONAL_ID' | 'PASSPORT' | 'DRIVERS_LICENSE' | 'SSN' | 'TAX_ID' | string;
  issuing_country: string;
  id_number_hash: string;
  is_primary: boolean;
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED' | string;
  expiry_date?: string | null;
  created_at: string;
  updated_at: string;
}

// =================================================================
// 4. USER EMAILS & AUTHENTICATION CREDENTIALS
// =================================================================
export interface UserEmail {
  id: string; // e.g. 'uemail-1'
  user_id: string;
  email_id: string;
  is_primary: boolean;
  is_self_added: boolean; // FALSE = Business Invite (Cannot be Primary)
  created_at: string;
}

export interface UserCredential {
  id: string; // e.g. 'ucred-1'
  user_id: string;
  email_id?: string | null; // null = Global Password; string = Scoped Work Password
  password_hash: string;
  auth_type: 'PASSWORD' | string;
  created_at: string;
  updated_at: string;
}

// =================================================================
// 5. BUSINESSES & DYNAMIC TENANT ROLES
// =================================================================
export interface Business {
  id: string; // e.g. 'biz-1'
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessEmail {
  id: string; // e.g. 'bemail-1'
  business_id: string;
  email_id: string;
  email_type: 'PRIMARY' | 'BILLING' | 'SUPPORT' | 'LEGAL' | string;
  label?: string | null;
  created_at: string;
}

export interface BusinessPermission {
  id: string; // e.g. 'bperm-1'
  code: string; // e.g. 'business.invoices.create'
  description?: string | null;
  created_at: string;
}

export interface BusinessRole {
  id: string; // e.g. 'brole-1'
  business_id?: string | null; // null = System Default Template
  name: string;
  description?: string | null;
  created_at: string;
}

export interface BusinessRolePermission {
  id: string; // e.g. 'brp-1'
  role_id: string;
  permission_id: string;
}

// =================================================================
// 6. BUSINESS MEMBERSHIPS (The Core Bridge)
// =================================================================
export interface BusinessMembership {
  id: string; // e.g. 'bmem-1'
  business_id: string;
  user_id: string;
  membership_type: 'OWNER' | 'MEMBER' | 'GUEST' | string;
  role_id: string;
  contact_email_id?: string | null;
  status: 'ACTIVE' | 'REVOKED' | 'FROZEN_BY_PLATFORM' | string;
  created_at: string;
  updated_at: string;
}

// =================================================================
// 7. ADDRESSES TABLE
// =================================================================
export interface Address {
  id: string; // e.g. 'addr-1'
  user_id?: string | null;
  business_id?: string | null;
  address_type: 'RESIDENTIAL' | 'MAILING' | 'REGISTERED_OFFICE' | 'PRIMARY' | string;
  street_line1: string;
  street_line2?: string | null;
  city: string;
  state?: string | null;
  postal_code: string;
  country: string;
  is_primary: boolean;
  created_at: string;
}

// =================================================================
// 8. TAXONOMY & PRODUCT CATALOG
// =================================================================
export interface Category {
  id: string; // e.g. 'cat-1'
  parentId?: string | null;
  name: string;
  slug?: string;
  mappedGroupIds?: string[];
  created_at?: string;
}

export interface AttributeGroup {
  id: string; // e.g. 'grp-1'
  code: string;
  name: string;
  description?: string;
  attributeIds?: string[];
  created_at?: string;
}

export interface Attribute {
  id: string; // e.g. 'attr-1'
  code: string;
  name: string;
  label: string;
  inputType: 'select' | 'multiselect' | 'text' | 'number' | string;
  type?: string;
  unit?: string;
  valueIds?: string[];
  created_at?: string;
}

export interface AttributeValue {
  id: string; // e.g. 'val-1'
  value: string;
  label: string;
  sortOrder?: number;
  created_at?: string;
}

export interface Product {
  id: string; // e.g. 'prod-1'
  name: string;
  categoryId: string;
  SKU: string;
  dynamicAttributes?: Record<string, string | string[]>;
  globalSpecs?: Record<string, string | string[]>;
  created_at?: string;
}

// =================================================================
// DATABASE CLASS DEFINITION
// =================================================================
export class AppDatabase extends Dexie {
  emails!: Table<Email>;
  users!: Table<User>;
  platformPermissions!: Table<PlatformPermission>;
  platformRoles!: Table<PlatformRole>;
  platformRolePermissions!: Table<PlatformRolePermission>;
  userPlatformRoles!: Table<UserPlatformRole>;
  userIdentifications!: Table<UserIdentification>;
  userEmails!: Table<UserEmail>;
  userCredentials!: Table<UserCredential>;
  businesses!: Table<Business>;
  businessEmails!: Table<BusinessEmail>;
  businessPermissions!: Table<BusinessPermission>;
  businessRoles!: Table<BusinessRole>;
  businessRolePermissions!: Table<BusinessRolePermission>;
  businessMemberships!: Table<BusinessMembership>;
  addresses!: Table<Address>;

  // Taxonomy tables
  categories!: Table<Category>;
  attributeGroups!: Table<AttributeGroup>;
  attributes!: Table<Attribute>;
  attributeValues!: Table<AttributeValue>;
  products!: Table<Product>;

  constructor() {
    super('DelexyAppDB');
    this.version(1).stores({
      emails: 'id, &email',
      users: 'id, &app_user_id, is_platform_active, is_active',
      platformPermissions: 'id, &code',
      platformRoles: 'id, &name, is_system_default',
      platformRolePermissions: 'id, [role_id+permission_id], role_id, permission_id',
      userPlatformRoles: 'id, [user_id+role_id], user_id, role_id',
      userIdentifications: 'id, user_id, id_type, &id_number_hash, verification_status',
      userEmails: 'id, user_id, email_id, [user_id+email_id], is_primary, is_self_added',
      userCredentials: 'id, user_id, email_id',
      businesses: 'id, &slug, is_active',
      businessEmails: 'id, business_id, email_id, email_type',
      businessPermissions: 'id, &code',
      businessRoles: 'id, business_id, name',
      businessRolePermissions: 'id, [role_id+permission_id], role_id, permission_id',
      businessMemberships: 'id, business_id, user_id, [business_id+user_id], role_id, status',
      addresses: 'id, user_id, business_id, address_type',

      // Taxonomy tables
      categories: 'id, parentId, name',
      attributeGroups: 'id, code, name',
      attributes: 'id, code, label',
      attributeValues: 'id, value, label',
      products: 'id, categoryId, SKU',
    });
  }
}

export const db = new AppDatabase();
