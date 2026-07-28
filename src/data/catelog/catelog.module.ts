export interface Category {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  parentId: string | null;
  mappedGroupIds: string[];
  childrenCount?: number;
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

export interface AttributeValue {
  id: string;
  attributeId: string;
  value: string;
  label?: string;
}

export interface Attribute {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'multiselect';
  valueIds?: string[];
  unit?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  title: string;
  slug?: string;
  categoryId: string;
  brand?: string;
  manufacturer?: string;
  dynamicAttributes: Record<string, any>;
  globalSpecs?: Record<string, any>;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}
