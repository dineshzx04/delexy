export interface AttributeValue {
  id: string;
  attributeId: string;
  value: string;
  label?: string;
}

export interface Attribute {
  id: string;
  name: string;
  code?: string;
  label?: string;
  valueIds?: string[];
  unit?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AttributeGroup {
  id: string;
  name: string;
  attributeIds: string[];
  created_at?: string;
  updated_at?: string;
}

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  parentId: string | null;
  level?: number;
  mappedGroupIds: string[];
  childrenCount?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CatalogProduct {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  isActive?: boolean;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  created_at?: string;
  updated_at?: string;
}

export interface SellerProduct {
  id: string;
  seller_party_id: string;
  product_id: string;
  brand_id?: string;
  manufacturer_party_id?: string;
  sku: string;
  barcode?: string;
  price: number;
  currency: string;
  stock: number;
  status: "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";
  dynamicAttributes: Record<string, any>;
  globalSpecs?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}
