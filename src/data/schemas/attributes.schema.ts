export interface AttributeValue {
  id: string; // e.g. 'val-1'
  attributeId: string; // e.g. 'attr-1'
  value: string;
  code: string;
  displayOrder: number;
}

export interface Attribute {
  id: string; // e.g. 'attr-1'
  name: string;
  code: string;
  type: 'SELECT' | 'MULTI_SELECT' | 'TEXT' | 'NUMBER' | 'BOOLEAN';
  description?: string;
  unit?: string;
  isRequired: boolean;
  valueIds?: string[]; // array of 'val-1', etc.
}

export interface AttributeGroup {
  id: string; // e.g. 'group-1'
  name: string;
  code: string;
  description?: string;
  attributeIds: string[]; // array of 'attr-1', etc.
}
