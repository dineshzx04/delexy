export interface Business {
  id: string; // e.g. 'business-1'
  name: string; // e.g. 'Business A'
  slug: string;
  registration_number?: string;
  default_currency: string; // ISO 4217 e.g. 'USD'
  country_of_incorporation: string; // ISO Alpha-3 e.g. 'USA'
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
