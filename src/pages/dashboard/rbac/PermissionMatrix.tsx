import React, { useState } from 'react';
import { Table as AntTable, Checkbox as AntCheckbox, Tooltip as AntTooltip } from 'antd';
import * as Lucide from 'lucide-react';

interface PermissionMatrixProps {
  value?: Record<string, string[]>;
  onChange?: (value: Record<string, string[]>) => void;
  disabled?: boolean;
}

const RESOURCES = [
  { id: 'users', label: 'Users & Team', icon: <Lucide.Users size={16} /> },
  { id: 'organizations', label: 'Organizations', icon: <Lucide.Building size={16} /> },
  { id: 'products', label: 'Products', icon: <Lucide.Package size={16} /> },
  { id: 'rfqs', label: 'RFQs (Quotes)', icon: <Lucide.FileText size={16} /> },
  { id: 'orders', label: 'Orders', icon: <Lucide.ShoppingCart size={16} /> },
  { id: 'payments', label: 'Payments & Invoices', icon: <Lucide.CreditCard size={16} /> },
  { id: 'reports', label: 'Reports', icon: <Lucide.BarChart2 size={16} /> },
  { id: 'settings', label: 'Settings', icon: <Lucide.Settings size={16} /> },
];

const ACTIONS = [
  { id: 'read', label: 'Read' },
  { id: 'create', label: 'Create' },
  { id: 'update', label: 'Update' },
  { id: 'delete', label: 'Delete' },
  { id: 'approve', label: 'Approve' },
  { id: 'publish', label: 'Publish' },
  { id: 'invite', label: 'Invite' },
  { id: 'manage_roles', label: 'Manage Roles' },
];

// Define which actions are valid for which resources
const VALID_PERMISSIONS: Record<string, string[]> = {
  users: ['read', 'create', 'update', 'delete', 'invite', 'manage_roles'],
  organizations: ['read', 'create', 'update', 'delete'],
  products: ['read', 'create', 'update', 'delete', 'publish'],
  rfqs: ['read', 'create', 'update', 'delete', 'approve'],
  orders: ['read', 'create', 'update', 'delete', 'approve'],
  payments: ['read', 'create', 'update', 'approve'],
  reports: ['read', 'create', 'delete'],
  settings: ['read', 'update'],
};

const PermissionMatrix: React.FC<PermissionMatrixProps> = ({ value = {}, onChange, disabled = false }) => {
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
      title: 'Resource',
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

export default PermissionMatrix;
