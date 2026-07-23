export interface PlatformPermission {
  id: string; // e.g. 'perm-1'
  code: string; // e.g. 'platform.businesses.view'
  description?: string;
  created_at: string;
}

export interface PlatformRole {
  id: string; // e.g. 'prole-1'
  name: string;
  description?: string;
  is_system_default: boolean;
  created_at: string;
}

export interface PlatformRolePermission {
  role_id: string;
  permission_id: string;
}

export interface UserPlatformRole {
  user_id: string;
  role_id: string;
  granted_at: string;
}
