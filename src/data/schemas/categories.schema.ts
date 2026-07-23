export interface Category {
  id: string;
  name: string;
  code: string;
  slug: string;
  parentId: string | null;
  level: number;
  mappedGroupIds: string[];
  childrenCount?: number;
  [key: string]: any;
}
