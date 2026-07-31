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
  type: 'PERSONAL' | 'MEMBER';
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

export interface UserIdentification {
  id: string;
  user_id: string;
  id_type: string;
  issuing_country: string;
  id_number: string;
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  expiry_date?: string;
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

export interface Address {
  id: string;
  party_id: string;
  address_type?: 'HQ' | 'BRANCH' | 'WAREHOUSE' | 'RESIDENTIAL';
  line1: string;
  line2?: string;
  city: string;
  state_province: string;
  postal_code: string;
  country_code: string;
  country_name?: string;
  is_primary: boolean;
  created_at: string;
  updated_at?: string;
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

export interface Role {
  id: string;
  business_id: string;
  role_name: string;
  permissions?: string[];
  created_at: string;
  updated_at: string;
}

export interface BusinessMembership {
  id: string;
  business_id: string;
  user_id: string;
  membership_type: 'OWNER' | 'MEMBER';
  email_id?: string | null;
  role_id?: string | null;
  status: string;
  require_switch_password?: boolean;
  switch_password?: string | null;
  deletedAt?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthCredential {
  id: string;
  credential_type: 'INDIVIDUAL' | 'BUSINESS';
  email_id?: string | null;
  user_id: string;
  business_membership_id?: string | null;
  password?: string;
  auth_type: string;
  created_at: string;
  updated_at: string;
}

export type PlatformMembershipType = 'SUPER_ADMIN' | 'PLATFORM_MEMBER';

export interface PlatformRole {
  id: string;
  role_name: string;
  description?: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface PlatformMembership {
  id: string;
  user_id: string;
  membership_type: PlatformMembershipType;
  platform_role_id?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  require_switch_password: boolean;
  switch_password?: string | null;
  created_at: string;
  updated_at: string;
}
