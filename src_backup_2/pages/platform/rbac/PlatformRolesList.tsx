import React from 'react';
import { Table as AntTable, Button as AntButton, Tag as AntTag, Input as AntInput } from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';

const PlatformRolesList: React.FC = () => {
  const navigate = useNavigate();

  const breadcrumbs = React.useMemo(() => [
    { title: <Link to="/platform" className="text-gray-500 hover:text-sky-600 transition-colors">Platform</Link>, url: '/platform' },
    { title: <Link to="/platform/rbac/roles" className="text-gray-900 font-semibold cursor-default pointer-events-none">Platform Roles</Link> }
  ], []);

  useBreadcrumb(breadcrumbs);

  const roles = [
    {
      id: '1',
      name: 'Super Admin',
      description: 'Unrestricted access to all platform configurations, tenants, and billing.',
      usersCount: 1,
      lastModified: 'Oct 12, 2023',
      isDefault: true,
    },
    {
      id: '2',
      name: 'Catalog Manager',
      description: 'Can manage global categories, attributes, and products.',
      usersCount: 2,
      lastModified: 'Nov 05, 2023',
      isDefault: false,
    },
    {
      id: '3',
      name: 'Support Specialist',
      description: 'Can view tenants and users to assist with support requests.',
      usersCount: 5,
      lastModified: 'Dec 01, 2023',
      isDefault: false,
    }
  ];

  const columns = [
    {
      title: 'Role Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div>
          <div className="font-semibold text-gray-900 flex items-center gap-2">
            {text}
            {record.isDefault && <AntTag color="purple" className="m-0 border-0 text-[10px] leading-3">SYSTEM DEFAULT</AntTag>}
          </div>
          <div className="text-sm text-gray-500">{record.description}</div>
        </div>
      )
    },
    {
      title: 'Assigned Admins',
      dataIndex: 'usersCount',
      key: 'usersCount',
      width: 150,
      render: (count: number) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Lucide.Shield size={16} />
          {count} admins
        </div>
      )
    },
    {
      title: 'Last Modified',
      dataIndex: 'lastModified',
      key: 'lastModified',
      width: 150,
      render: (text: string) => <span className="text-gray-500">{text}</span>
    },
    {
      title: 'Actions',
      key: 'action',
      width: 120,
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2">
          <AntButton type="text" size="small" className="text-sky-600 hover:text-sky-700 hover:bg-sky-50" onClick={() => navigate(`/platform/rbac/roles/${record.id}`)}>
            Edit
          </AntButton>
          {!record.isDefault && (
            <AntButton type="text" danger size="small">
              Delete
            </AntButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="w-full max-w-6xl">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Platform Roles</h1>
          <p className="text-gray-500">Manage internal roles and permissions for platform administration.</p>
        </div>
        <AntButton type="primary" className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2" size="large" onClick={() => navigate('/platform/rbac/roles/new')}>
          <Lucide.Plus size={16} /> Create Platform Role
        </AntButton>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <AntInput 
            placeholder="Search roles..." 
            prefix={<Lucide.Search size={16} className="text-gray-400" />} 
            className="w-72"
          />
        </div>
        <AntTable 
          columns={columns} 
          dataSource={roles} 
          pagination={false}
          className="w-full"
          rowKey="id"
          rowClassName="hover:bg-slate-50 transition-colors"
        />
      </div>
    </div>
  );
};

export default PlatformRolesList;
