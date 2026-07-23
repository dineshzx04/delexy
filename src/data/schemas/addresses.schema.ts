export interface Address {
  id: string; // e.g. 'addr-1'
  entity_type: 'USER' | 'BUSINESS';
  entity_id: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state_province_region?: string;
  postal_code?: string;
  country_iso3: string;
  is_primary: boolean;
  created_at: string;
}
