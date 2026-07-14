import React, { useState } from 'react';
import { Table as AntTable, Checkbox as AntCheckbox, Tooltip as AntTooltip } from 'antd';
import * as Lucide from 'lucide-react';

interface PlatformPermissionMatrixProps {
  value?: Record<string, string[]>;
  onChange?: (value: Record<string, string[]>) => void;
  disabled?: boolean;
}

const RESOURCES = [
  { id: 'platform_users', label: 'Platform Admins', icon: <Lucide.Shield size={16} /> },
  { id: 'tenants', label: 'Tenants & Orgs', icon: <Lucide.Building2 size={16} /> },
  { id: 'master_catalog', label: 'Master Catalog', icon: <Lucide.Package size={16} /> },
  { id: 'taxonomies', label: 'Global Taxonomies', icon: <Lucide.Layers size={16} /> },
  { id: 'billing', label: 'Platform Billing', icon: <Lucide.DollarSign size={16} /> },
  { id: 'system_settings', label: 'System Settings', icon: <Lucide.Settings2 size={16} /> },
];

const ACTIONS = [
  { id: 'read', label: 'Read' },
  { id: 'create', label: 'Create' },
  { id: 'update', label: 'Update' },
  { id: 'delete', label: 'Delete' },
  { id: 'manage_roles', label: 'Manage Roles' },
];

// Define which actions are valid for platform resources
const VALID_PERMISSIONS: Record<string, string[]> = {
  platform_users: ['read', 'create', 'update', 'delete', 'manage_roles'],
  tenants: ['read', 'create', 'update', 'delete'],
  master_catalog: ['read', 'create', 'update', 'delete'],
  taxonomies: ['read', 'create', 'update', 'delete'],
  billing: ['read', 'update'],
  system_settings: ['read', 'update'],
};

const PlatformPermissionMatrix: React.FC<PlatformPermissionMatrixProps> = ({ value = {}, onChange, disabled = false }) => {
  const [permissions, setPermissions] = useState<Record<string, string[]>>(value);

  const handleCheckboxChange = (resourceId: string, actionId: string, checked: boolean) => {
    if (disabled) return;
    
    const newPermissions = { ...permissions };
    if (!newPermissions[resourceId]) {
      newPermissions[resourceId] = [];
    }
    
    if (checked) {
      if (!newPermissions[resourceId].includes(actionId)) {
        newPermissions[resourceId].push(actionId);
      }
    } else {
      newPermissions[resourceId] = newPermissions[resourceId].filter(a => a !== actionId);
    }
    
    setPermissions(newPermissions);
    onChange?.(newPermissions);
  };

  const handleSelectRow = (resourceId: string, checked: boolean) => {
    if (disabled) return;
    
    const newPermissions = { ...permissions };
    if (checked) {
      newPermissions[resourceId] = [...VALID_PERMISSIONS[resourceId]];
    } else {
      newPermissions[resourceId] = [];
    }
    
    setPermissions(newPermissions);
    onChange?.(newPermissions);
  };

  const columns = [
    {
      title: 'Global Resource',
      dataIndex: 'label',
      key: 'resource',
      width: 200,
      fixed: 'left' as const,
      render: (text: string, record: any) => (
        <div className="flex items-center gap-2 font-medium text-gray-700">
          <span className="text-gray-400">{record.icon}</span>
          {text}
        </div>
      ),
    },
    {
      title: (
        <AntTooltip title="Select all valid permissions for this resource">
          <span className="text-gray-500 cursor-help border-b border-dashed border-gray-300">All</span>
        </AntTooltip>
      ),
      key: 'selectAll',
      width: 60,
      align: 'center' as const,
      render: (_: any, record: any) => {
        const validCount = VALID_PERMISSIONS[record.id]?.length || 0;
        const currentCount = (permissions[record.id] || []).length;
        const isAllSelected = validCount > 0 && currentCount === validCount;
        const isIndeterminate = currentCount > 0 && currentCount < validCount;
        
        return (
          <AntCheckbox 
            disabled={disabled || validCount === 0}
            checked={isAllSelected}
            indeterminate={isIndeterminate}
            onChange={(e) => handleSelectRow(record.id, e.target.checked)}
          />
        );
      }
    },
    ...ACTIONS.map(action => ({
      title: <div className="text-xs uppercase tracking-wider text-gray-500 transform rotate-[-45deg] pb-4 pr-2">{action.label}</div>,
      key: action.id,
      width: 60,
      align: 'center' as const,
      render: (_: any, record: any) => {
        const isValid = VALID_PERMISSIONS[record.id]?.includes(action.id);
        const isChecked = (permissions[record.id] || []).includes(action.id);
        
        if (!isValid) {
          return <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300">-</div>;
        }
        
        return (
          <AntCheckbox 
            disabled={disabled}
            checked={isChecked}
            onChange={(e) => handleCheckboxChange(record.id, action.id, e.target.checked)}
          />
        );
      }
    }))
  ];

  return (
    <div className="border border-gray-200 rounded-lg overflow-x-auto bg-white">
      <AntTable 
        columns={columns} 
        dataSource={RESOURCES} 
        pagination={false}
        rowKey="id"
        size="small"
        bordered
        className="permission-matrix"
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
};

export default PlatformPermissionMatrix;
