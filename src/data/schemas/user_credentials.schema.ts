export interface UserCredential {
  id: string; // e.g. 'cred-1'
  user_id: string;
  email: string;
  password_hash: string;
  auth_type: 'PASSWORD' | 'SSO' | 'OAUTH';
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessMembership {
  id: string; // e.g. 'member-1'
  business_id: string; // e.g. 'business-1'
  user_id: string; // e.g. 'user-1'
  credential_id: string;
  role_id: string;
  status: 'ACTIVE' | 'REVOKED' | 'FROZEN_BY_PLATFORM';
  created_at: string;
  updated_at: string;
}
