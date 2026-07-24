import Dexie, { type Table } from 'dexie';

export interface User {
  id: string;
  app_user_id?: string;
  first_name?: string;
  last_name?: string;
  full_name: string;
  date_of_birth?: string;
  place_of_birth?: string;
  country_of_residence?: string;
  is_active: boolean;
  is_platform_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailRecord {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface UserEmail {
  id: string;
  user_id: string;
  email_id: string;
  is_primary: boolean;
  is_self_added: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at?: string;
}

export interface AuthCredential {
  id: string;
  credential_type: 'INDIVIDUAL' | 'BUSINESS';
  email_id: string;
  user_id: string;
  business_membership_id?: string | null;
  password?: string;
  auth_type: string;
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  name: string;
  legal_name?: string;
  slug?: string;
  website?: string;
  phone?: string;
  country_code: string;
  is_active: boolean;
  is_claimed: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessMembership {
  id: string;
  business_id: string;
  user_id: string;
  membership_type: 'OWNER' | 'MEMBER';
  role_id?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface UserBusinessRole {
  id: string;
  business_id: string;
  role_name: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessEmail {
  id: string;
  business_id: string;
  email_id: string;
  email_type: string;
  label?: string;
  is_verified: boolean;
  created_at: string;
}

export interface UserAddress {
  id: string;
  user_id: string;
  line1: string;
  line2?: string;
  city: string;
  state_province: string;
  postal_code: string;
  country_code: string;
  is_primary: boolean;
}

export interface UserIdentification {
  id: string;
  user_id: string;
  id_type: string;
  issuing_country: string;
  id_number: string;
  verification_status: string;
  expiry_date?: string;
  created_at: string;
  updated_at: string;
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

export class DelexyDatabase extends Dexie {
  users!: Table<User, string>;
  emails!: Table<EmailRecord, string>;
  userEmails!: Table<UserEmail, string>;
  authCredentials!: Table<AuthCredential, string>;
  businesses!: Table<Business, string>;
  businessMemberships!: Table<BusinessMembership, string>;
  userBusinessRoles!: Table<UserBusinessRole, string>;
  businessEmails!: Table<BusinessEmail, string>;
  userAddresses!: Table<UserAddress, string>;
  userIdentifications!: Table<UserIdentification, string>;
  categories!: Table<Category, string>;

  constructor() {
    super('DelexyDB');
    this.version(4).stores({
      users: 'id, app_user_id',
      emails: 'id, email',
      userEmails: 'id, user_id, email_id',
      authCredentials: 'id, email_id, user_id',
      businesses: 'id, slug',
      businessMemberships: 'id, business_id, user_id',
      userBusinessRoles: 'id, business_id',
      businessEmails: 'id, business_id, email_id',
      userAddresses: 'id, user_id',
      userIdentifications: 'id, user_id',
      categories: 'id, parentId'
    });
  }
}

export const db = new DelexyDatabase();
