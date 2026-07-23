export interface User {
  id: string; // e.g. 'user-1'
  first_name: string;
  last_name: string;
  full_name: string;
  national_id_hash?: string;
  primary_phone_e164?: string;
  preferred_locale: string;
  timezone: string;
  country_of_residence: string;
  is_platform_active: boolean;
  is_active: boolean;
  terms_accepted_at?: string;
  privacy_policy_accepted_at?: string;
  created_at: string;
  updated_at: string;
}
