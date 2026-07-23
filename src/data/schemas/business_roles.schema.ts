export interface BusinessPermission {
  id: string; // e.g. 'bperm-1'
  code: string;
  description?: string;
  created_at: string;
}

export interface BusinessRole {
  id: string; // e.g. 'brole-1'
  business_id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface BusinessRolePermission {
  role_id: string;
  permission_id: string;
}
